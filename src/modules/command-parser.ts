import * as api from '../nodebb/api';
import { EventEmitter } from 'events';
import striptags = require( 'striptags' );
import NodeBBSocket from '../nodebb/socket';

import Schedule from '../schedule';

import * as rp from 'request-promise';
import * as WebSocket from 'ws';

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
			console.log( `recv> ${JSON.stringify(data)}` );
			this.buffer += data;
		} );

		for( let evt of [ 'open', 'close', 'error', 'message' ] ) {
			ws.addEventListener( evt, this.emit.bind( this, evt ), false );
		}

		ws.addEventListener( 'error', console.error.bind( console ), false );
	}

	public read() {
		const { buffer } = this;
		this.buffer = '';
		return buffer;
	}

	public write( msg: string ) {
		console.log( `send> ${JSON.stringify(msg)}` );
		this.ws.send( msg );
	}

	private ws: WebSocket;
	private buffer = '';
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

	let outBuffer = '';

	const stdin = new Sock( `${url}ws/stdin` ),
		stdout = new Sock( `${url}ws/stdout` ),
		stderr = new Sock( `${url}ws/stderr` );

	const schedule = new Schedule;
	schedule.addTask( async () => {
		const data = stdout.read();

		if( data ) {
			outBuffer += data;
		} else if( outBuffer ) {
			writeln( outBuffer );
			outBuffer = '';
		}
	}, { interval: 50 } );

	schedule.addTask( async () => {
		const data = stderr.read();
		if( data ) {
			console.error( data );
		}
	}, { interval: 50 } );

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
		stdin.write( cmd + '\n' );
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
