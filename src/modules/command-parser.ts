import * as api from '../nodebb/api';
import { EventEmitter } from 'events';
import striptags = require( 'striptags' );

import Schedule from '../schedule';

import * as rp from 'request-promise';

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

class OutputAppender extends EventEmitter {
	public append( str: string ) {
		this.buffer += str;
		const currentValue = this.buffer;
		setTimeout( () => {
			if( this.buffer !== currentValue ) { return; }
			this.buffer = '';
			this.emit( 'output', currentValue );
		}, 1000 );
	}
	private buffer = '';
}

const factory = async (
	{
		socket,
		messageQueue,
		actionQueue,
		url,
		tid: tid_active
	} ) => {
	const outputAppender = new OutputAppender;

	function writeln( content: string ) {
		actionQueue.enqueue( () => api.posts.reply( { socket, tid: tid_active, content } ) );
	}

	outputAppender.on( 'output', content => {
		writeln( content );
	} );

	async function poll( path: string ) {
		const body = await rp( {
			method: 'GET',
			url: url + path
		} );
		return body;
	}

	const schedule = new Schedule;
	schedule.addTask( async () => {
		const stdout = await poll( 'stdout' );
		if( stdout ) {
			outputAppender.append( stdout );
		}
	}, { interval: 50 } );

	schedule.addTask( async () => {
		const stderr = await poll( 'stderr' );
		if( stderr ) {
			console.error( stderr );
		}
	}, { interval: 50 } );

	async function command( cmd: string ) {
		cmd =
			cmd.replace( /\r/g, '' )
			.split( '\n' )
			.map( s => striptags( s ).trim() )
			.filter( s => !/^@[-_\w\d]\s+said\s+in\s+/i.test( s ) )
			.map( s => s.replace( /\*|\[|\]|\(|\)|\`/g, '' ).trim() )
			.map( s => s.replace( /@error_bot/gi, '' ).trim() )
			.filter( s => !/^[->@\*]/i.test( s ) )
			.filter( s => !!s )
			.join( '\n' );
		if( !cmd ) {
			return;
		}
		await rp( {
			method: 'PUT',
			url: url + 'stdin',
			body: cmd + '\n',
			headers: { 'Content-Type': 'text/plain' }
		} );
	}

	const handlers = new Map<string, Function>();

	handlers.set( 'event:new_notification', ( args: NotificationArgs ) => {
		const { bodyLong, tid } = args;
		if( tid !== tid_active ) { return; }
		command( bodyLong );
	} );

	schedule.addTask( async () => {
		const promise = messageQueue.dequeue();
		if( !promise ) {
			return { skip: true };
		}

		const [ message, args ] = await promise(),
			handler = handlers.get( message );
		if( !handler ) {
			return;
		}
		handler( ...args );
	}, { interval: 20 } );

	return {
		tick() {
			schedule.runTask();
		}
	};
};

export default factory;
