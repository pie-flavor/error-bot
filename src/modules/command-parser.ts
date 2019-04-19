import * as api from '~nodebb/api';
import { EventEmitter } from 'events';
import striptags from 'striptags';
import { NodeBBSocket } from '~nodebb/socket';

import { Schedule } from '~schedule';

import WebSocket from 'ws';

interface NewPostArgs {
	posts: {
		pid: number;
		uid: number;
		tid: number;
		content: string;
		timestamp: number;
		reputation: number;
		editor: string;
		edited: number;
		deleted: number;
		ip?: string;
		cid: number;
		user: {
			username: string;
			userslug: string;
			lastonline: number;
			picture: string;
			fullname: string;
			signature: string;
			reputation: number;
			postcount: number;
			banned: boolean;
			status: string;
			uid: number;
			groupTitle: string;
			'icon:text': string;
			'icon:bgColor': string;
			banned_until: number;
			banned_until_readable: string;
			selectedGroup: {
				name: string;
				slug: string;
				labelColor: string;
				icon: string;
				userTitle: string;
			};
			custom_profile_info: Array<void>;
		};
		topic: {
			tid: number;
			title: string;
			slug: string;
			cid: number;
			postcount: number;
			mainPid: number;
		};
		index: number;
		favourited: boolean;
		votes: number;
		display_moderator_tools: boolean;
		display_move_tools: boolean;
		selfPost: boolean;
		timestampISO: string;
	}[];
	'reputation:disabled': boolean;
	'downvote:disabled': boolean;
}

interface ChatReceiveArgs {
	roomId: string;
	fromUid: number;
	message: {
		content: string;
		timestamp: number;
		fromuid: number;
		roomId: string;
		messageId: number;
		fromUser: {
			username: string;
			userslug: string;
			picture: string;
			status: string;
			uid: number;
			'icon:text': string;
			'icon:bgColor': string;
		};
		self: number;
		timestampISO: string;
		newSet: boolean;
		cleanedContent: string;
		mid: number;
	};
	self: number;
}

interface NotificationArgs {
	bodyShort: string;
	bodyLong: string;
	nid: string;
	pid: number;
	tid: number;
	from: number;
	path: string;
	important: number;
	datetime: number;
}

type FactoryOpts = {
	socket: NodeBBSocket;
	messageQueue: Array<[ string, any[] ]>;
	actionQueue: Array<() => Promise<void>>;
	url: string;
	tid: number;
};

class Sock extends EventEmitter {
	constructor( public url: string ) {
		super();
		const ws = this.ws = new WebSocket( url );

		ws.addEventListener( 'message', ( { data } ) => {
			data = ( data || '' ) + '';
			if( !data ) { return; }
			data = JSON.parse( data );
			console.log( `recv> ${JSON.stringify(data)}` );
			this.messages.push( data );
		} );

		for( let evt of [ 'open', 'close', 'error', 'message' ] ) {
			ws.addEventListener( evt, this.emit.bind( this, evt ) );
		}

		ws.addEventListener( 'error', console.error.bind( console ) );
	}

	public read() {
		const { messages } = this;
		return messages.shift();
	}

	public write( msg ) {
		console.log( `send> ${JSON.stringify(msg)}` );
		this.ws.send( JSON.stringify(msg) );
	}

	private ws: WebSocket;
	private messages = [];
}

class Buffer {
	public append( data: string ) {
		this.lastAppend = performance.now();
		this.buffer += ( data || '' ) + '';
	}

	public clear() {
		const retval = this.buffer;
		this.lastAppend = null;
		this.buffer = '';
		return retval;
	}

	public get timeSinceAppend() {
		const { lastAppend } = this;
		if( lastAppend ) {
			return Math.max( 0, performance.now() - lastAppend );
		} else {
			return null;
		}
	}

	private buffer = '';
	private lastAppend: number = null;
}

const factory = async (
	{
		socket,
		messageQueue,
		actionQueue,
		url,
		tid: tid_active
	}: FactoryOpts ) => {

	function escapeMarkdown( str ) {
		return str.replace( /\[|\]|\(|\)|\*|\>|\`|\_|\\/g, s => `\\${s}` );
	}

	function writeln( content: string ) {
		content = escapeMarkdown( content || '' );
		actionQueue.push( () => api.posts.reply( { socket, tid: tid_active, content } ) );
	}

	let buffers = {
		stdout: new Buffer,
		stderr: new Buffer
	};

	const sock = new Sock( url );

	const schedule = new Schedule;
	schedule.addTask( async () => {
		const message = sock.read();
		if( !message ) { return { skip: true }; }

		const { name, data } = message;
		if( !data ) { return { skip: true }; }

		if( !buffers.hasOwnProperty( name ) ) {
			throw new Error( `Unknown buffer: ${name}` );
		}

		buffers[ name ].append( data );
	}, { interval: 25 } );

	schedule.addTask( async () => {
		const buffer = buffers.stdout;
		if( !( buffer.timeSinceAppend >= 150 ) ) { return { skip: true }; };
		writeln( buffer.clear() );
	}, { interval: 10 } );

	schedule.addTask( async () => {
		const buffer = buffers.stderr;
		if( !( buffer.timeSinceAppend >= 150 ) ) { return { skip: true }; };
		console.error( buffer.clear() );
	}, { interval: 10 } );

	async function command( cmd: string ) {
		cmd =
			cmd.replace( /\r/g, '' )
			.split( '\n' )
			.map( s => striptags( s ).trim() )
			.filter( s => !/^@[-_\w\d]+\s+said\s+in\s+/i.test( s ) )
			.map( s => s.replace( /@error_bot/gi, '' ).trim() )
			.filter( s => !/^[->@\*]/i.test( s ) )
			.map( s => s.replace( /\[|\]|\(|\)|\*|\>|\`/g, '' ).trim() )
			.filter( s => !!s )
			.join( '\n' );
		if( !cmd ) {
			return;
		}
		console.log( `cmd> ${JSON.stringify(cmd)}` );
		sock.write( { name: 'stdin', data: cmd + '\n' } );
	}

	const handlers = new Map<string, Function>();

	handlers.set( 'event:new_notification', ( args: NotificationArgs ) => {
		const { bodyLong, tid } = args;
		if( tid !== tid_active ) { return; }
		command( bodyLong );
	} );

	schedule.addTask( async () => {
		if( !messageQueue.length ) {
			return { skip: true };
		}

		const [ message, args ] = await messageQueue.shift(),
			handler = handlers.get( message );
		if( !handler ) {
			return;
		}
		handler( ...args );
	}, { interval: 20 } );

	return schedule;
};

export default factory;
