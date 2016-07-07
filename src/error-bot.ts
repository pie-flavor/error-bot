import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';
import { auth, posts } from './nodebb-api';

import { wait } from './async-util';

import { Fsm, FsmState, FsmNullTransition, FsmPushTransition, FsmPopTransition } from './fsm';

import { topicId } from './config';

import AsyncQueue from './async-queue';
import asyncQueueModule from './modules/async-queue';

export default class ErrorBot {
	public async start() {
		return new Promise( async ( resolve, reject ) => {
			try {
				const session = new NodeBBSession,
					rest = new NodeBBRest,
					{ username, password } = require( '../data/auth.json' );

				console.log( 'Logging in...' );
				await auth.logIn( { session, rest, username, password } );
				console.log( 'Logged in' );

				const socket = await NodeBBSocket.connect( { session } ),
					messageQueue = new AsyncQueue<[string, any[]]>(),
					actionQueue = new AsyncQueue<void>( 500 ),
					commandQueue = new AsyncQueue<void>();

				socket.subscribe( messageQueue, 'event:new_notification' );

				const modules = [
					asyncQueueModule( commandQueue ),
					asyncQueueModule( actionQueue )
				];

				for( ; ; ) {
					for( let module of modules ) {
						module.tick();
					}
					await wait( 10 );
				}

				console.log( 'Logging out...' );
				await auth.logOut( { session, rest } );
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
