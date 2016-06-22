import { userAgent, baseUrl, connectTimeout, emitTimeout } from './config';
import NodeBBSession from './nodebb-session';
import { wait } from './async-util';
import { emit, waitFor } from './socket-waiter';

import * as io from 'socket.io-client';

type SessionOpts = { session: NodeBBSession };

export default class NodeBBSocket {
	private constructor( { socket }: { socket: SocketIOClient.Socket } ) {
		this.socket = socket;
	}

	public static connect( { session }: SessionOpts ) {
		const socket =
			io( baseUrl, {
				transports: [ 'websocket', 'polling' ],
				extraHeaders: {
					'User-Agent': userAgent,
					'Cookie': session.jar.getCookieString( baseUrl )
				}
			} as any );
		return Promise.race<any>( [
			waitFor( socket, 'connect' ),
			waitFor( socket, 'error' ),
			wait( connectTimeout ).then( () => Promise.reject( new Error( 'connect timeout' ) ) )
		] ).then( () => new NodeBBSocket( { socket } ) );
	}

	public emit( event: string, ...args: any[] ) {
		const { socket } = this;
		return Promise.race<any>( [
			emit( socket, event, ...args ),
			waitFor( socket, 'error' ),
			wait( emitTimeout ).then( () => Promise.reject( new Error( 'emit timeout' ) ) )
		] );
	}

	public socket: SocketIOClient.Socket;
}
