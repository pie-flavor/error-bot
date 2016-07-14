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
					actionQueue = new AsyncQueue<void>( 500 );

				const games = [
					// TDWTF Plays Zork I
					{ tid: 20461, url: 'http://localhost:1337/', messageQueue: new AsyncQueue<[string, any[]]>() },
					// Error_Bot in the Works
					{ tid: 14084, url: 'http://localhost:1338/', messageQueue: new AsyncQueue<[string, any[]]>() }
				];

				const modules =
					[
						await asyncQueueModule( actionQueue )
					];

				for( let { tid, url, messageQueue } of games ) {
					socket.subscribe( messageQueue, 'event:new_notification' );
					modules.push( await commandParserModule( { socket, tid, url, messageQueue, actionQueue } ) );
				}

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
