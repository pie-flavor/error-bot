import { userAgent, baseUrl, connectTimeout, emitTimeout } from '../config';
import NodeBBSession from './session';
import { wait } from '../async-util';
import { emit, waitFor } from '../socket-waiter';

import Priority from '../priority';
import AsyncQueue from '../async-queue';

import * as io from 'socket.io-client';

type ConnectOpts = SocketIOClient.ConnectOpts;
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
			} as ConnectOpts );
		socket.emit( 'foo' );
		return Promise.race<any>( [
			waitFor( socket, 'connect' ),
			waitFor( socket, 'connection' ),
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

	public subscribe( queue: AsyncQueue<[ string, any[] ]>, event: string, priority = Priority.Normal ) {
		const { socket } = this;

		socket.on( event, ( ...args ) => {
			queue.enqueue( () => [ event, args ], priority );
		} );
	}

	public socket: SocketIOClient.Socket;
}
