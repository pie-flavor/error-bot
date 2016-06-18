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
				await api.auth.logIn( { session, rest, username, password } );
				console.log( 'Logged in' );

				const socket = await NodeBBSocket.connect( { session } );
				await api.posts.reply( { socket, tid: topicId, content: '@error I feel much less sluggish now!' } );

				await wait( 1000 );

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
