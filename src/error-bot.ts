import NodeBBSession from './nodebb/session';
import NodeBBSocket from './nodebb/socket';
import { auth, posts } from './nodebb/api';

import { wait } from './async-util';

import AsyncQueue from './async-queue';
import asyncQueueModule from './modules/async-queue';
import commandParserModule from './modules/command-parser';

export default class ErrorBot {
	public async start() {
		return new Promise( async ( resolve, reject ) => {
			try {
				const session = new NodeBBSession,
					{ username, password } = require( '../data/auth.json' );

				console.log( 'Logging in...' );
				await auth.logIn( { session, username, password } );
				console.log( 'Logged in' );

				const socket = await NodeBBSocket.connect( { session } ),
					messageQueue = new AsyncQueue<[string, any[]]>(),
					actionQueue = new AsyncQueue<void>( 500 ),
					commandQueue = new AsyncQueue<void>();

				//socket.subscribe( messageQueue, 'event:new_post' );
				socket.subscribe( messageQueue, 'event:new_notification' );
				// socket.subscribe( messageQueue, 'event:chats.receive' );

				const commandParser = await commandParserModule( { socket, messageQueue, actionQueue, commandQueue } );

				const modules = await Promise.all( [
					// commandParser( { tid: 14084, cwd: 'C:/Users/error/Desktop/zork1', exe: '_zork1.com' } ),
					commandParser( { tid: 20461, cwd: 'C:/Users/error/Desktop/zork1', exe: '_zork1.com' } ),
					asyncQueueModule( commandQueue ),
					asyncQueueModule( actionQueue )
				] );

				console.log( 'Ready' );
				for( ; ; ) {
					for( let module of modules ) {
						module.tick();
					}
					await wait( 10 );
				}

				console.log( 'Logging out...' );
				await auth.logOut( { session } );
				console.log( 'Logged out' );

				resolve();
			} catch( ex ) {
				reject( ex );
			}
		} );
	}
}

abstract class RespondMode {
	public name: string;


}
