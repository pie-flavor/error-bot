import { userAgent, baseUrl, connectTimeout, emitTimeout } from './config';
import NodeBBSession from './nodebb-session';
import { wait } from './time';
import SocketWaiter from './socket-waiter';

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
		const waiter = new SocketWaiter;
		return Promise.race<any>( [
			waiter.waitFor( socket, 'error' ),
			waiter.waitFor( socket, 'connect' ),
			wait( connectTimeout ).then( () => Promise.reject( new Error( 'connect timeout' ) ) )
		] ).then( () => new NodeBBSocket( { socket } ) );
	}

	public emit( event: string, ...args: any[] ) {
		const { socket } = this,
			waiter = new SocketWaiter;
		return Promise.race<any>( [
			waiter.emit( socket, event, ...args ),
			wait( emitTimeout ).then( () => Promise.reject( new Error( 'emit timeout' ) ) )
		] );
	}

	private socket: SocketIOClient.Socket;
}
