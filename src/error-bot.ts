import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';
import NodeBBApi from './nodebb-api';

import SocketQueue from './socket-queue';

import { wait } from './time';

export default class ErrorBot {
	public async start() {
		return new Promise( async ( resolve, reject ) => {
			try {
				const session = new NodeBBSession,
					rest = new NodeBBRest,
					api = new NodeBBApi,
					{ username, password } = require( '../data/auth.json' );

				console.log( 'Logging in...' );
				await api.auth.logIn( { session, rest, username, password } );
				console.log( 'Logged in' );

				const socket = await NodeBBSocket.connect( { session } ),
					queue = new SocketQueue;

				queue.subscribe( socket.socket,
					'event:new_notification'
				);
				for( ; ; ) {
					await wait( 20 );
					const [ event, args ] = queue.dequeue() || [];
					if( !event ) {
						continue;
					}
					const [ { tid, pid, bodyLong } ] = args;
					await api.posts.reply( { socket, tid, toPid: pid, content: `${bodyLong}` } );
				}

				console.log( 'Logging out...' );
				await api.auth.logOut( { session, rest } );
				console.log( 'Logged out' );

				resolve();
			} catch( ex ) {
				reject( ex );
			}
		} );
	}
}
