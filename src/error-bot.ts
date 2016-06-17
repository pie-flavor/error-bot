import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';
import NodeBBApi from './nodebb-api';

import { topicId } from './config';

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
				await api.logIn( { session, rest, username, password } );
				console.log( 'Logged in' );

				await wait( 1000 );

				const socket = await NodeBBSocket.connect( { session } );
				console.log( 'connect' );
				await wait( 1000 );

				console.log( 'posts.reply', { tid: topicId, content: 'I live... again!', toPid: null, lock: false } );
				await socket.emit( 'posts.reply', { tid: topicId, content: 'I live... again!', toPid: null, lock: false } );

				await wait( 1000 * 5 );

				console.log( 'Logging out...' );
				await api.logOut( { session, rest } );
				console.log( 'Logged out' );

				resolve();
			} catch( ex ) {
				reject( ex );
			}
		} );
	}
}
