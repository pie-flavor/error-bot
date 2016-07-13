import * as api from '../nodebb/api';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import striptags = require( 'striptags' );
import AnsiParser = require( 'node-ansiparser' );

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
		}, 250 );
	}
	private buffer = '';
}

const factory = async (
	{
		socket,
		messageQueue,
		actionQueue
	} ) => {
	return async ( {
		tid: tid_active,
		cwd,
		exe
	} ) => {
		const outputAppender = new OutputAppender;

		function writeln( content: string ) {
			actionQueue.enqueue( () => api.posts.reply( { socket, tid: tid_active, content } ) );
		}

		outputAppender.on( 'output', content => {
			writeln( content );
		} );

		const parser = new AnsiParser( {
			inst_p(s) {
				outputAppender.append( s );
			},
			inst_x(flag) {
				outputAppender.append( flag );
			}
		} );

		const zork =
				spawn(
					'C:/Users/error/Desktop/msdos/binary/i486_x64/msdos.exe',
					[ exe ],
					{
						shell: true,
						cwd
					}
			);
			zork.stdout.on( 'data', ( data: Buffer ) => {
				parser.parse( data + '' );
			} );

			zork.stderr.on( 'data', ( data: Buffer ) => {
				console.error( `Error: ${data + ''}` );
				writeln( `**Error**: ${data + ''}\n` );
			} );

			zork.on( 'close', ( code: number ) => {
				const msg = `child process exited with code ${code}`;
				if( code === 0 ) {
					console.log( msg );
				} else {
					console.error( msg );
				}
				writeln( msg );
			} );


		const handlers = new Map<string, Function>();
	/*
		handlers.set( 'event:chats.receive', ( args: ChatReceiveArgs ) => {
			if( args.self ) {
				return;
			}
			const { roomId, message: { content: message } } = args;
			actionQueue.enqueue( () => api.modules.chats.send( { socket, roomId, message } ) );
		} );
	*/

		function command( cmd: string ) {
			cmd =
				cmd.replace( /\r/g, '' )
				.split( '\n' )
				.map( s => striptags( s ).trim() )
				.map( s => s.replace( /\*|\[|\]|\(|\)/g, '' ).trim() )
				.filter( s => !/^@[-a-z0-9_]+\ssaid/i.test( s ) )
				.map( s => s.replace( /@error_bot\s*/gi, '' ).trim() )
				.filter( s => !!s )
				.filter( s => !/^>\s*/i.test( s ) ) // no quotes
				.join( '\n' );
			if( !cmd ) {
				return;
			}
			console.log( cmd );
			zork.stdin.write( cmd + '\n' );
		}

	/*
		handlers.set( 'event:new_post', ( args: NewPostArgs ) => {
			// console.log( args );
			for( let { tid, content, selfPost, ip } of args.posts ) {
				if( tid !== tid_active || selfPost || ip ) {
					continue;
				}

			}
		} );
	*/

		handlers.set( 'event:new_notification', ( args: NotificationArgs ) => {
			const { bodyLong, tid } = args;
			if( tid !== tid_active ) { return; }
			command( bodyLong );
			// actionQueue.enqueue( () => api.posts.reply( { socket, toPid: pid, tid, content: bodyLong } ) );
		} );

		return {
			tick() {
				const promise = messageQueue.dequeue();
				if( !promise ) {
					return;
				}

				promise().then( ( [ message, args ] ) => {
					const handler = handlers.get( message );
					if( !handler ) {
						return;
					}
					handler( ...args );
				} );
			}
		};
	};
};

export default factory;
