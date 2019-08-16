import { fromEvent, of, throwError, timer, merge, Observable, Subject } from 'rxjs';
import { take, switchMap, mergeMap, map } from 'rxjs/operators';

import io from 'socket.io-client';

import { userAgent, baseUrl, connectTimeout, emitTimeout } from '~data/config.yaml';
import { NodeBBSession } from './session';
import { getAgent } from '~proxy-agent';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ConnectOpts = SocketIOClient.ConnectOpts;
type SessionOpts = { session: NodeBBSession };

type Socket = SocketIOClient.Socket;

function emit<T>( socket: Socket, event: string, ...args: any[] ) {
	return new Observable<T>( observer => {
		socket.emit( event, ...args, ( err, data ) => {
			if( err ) {
				observer.error( err );
			} else {
				observer.next( data );
				observer.complete();
			}
		} );

		return () => {};
	} );
}

export class NodeBBSocket {
	private constructor( { socket }: { socket: SocketIOClient.Socket } ) {
		this.socket = socket;

		disposed.pipe( take( 1 ) )
		.subscribe( () => {
			socket.close();
		} );
	}

	public static async connect( { session }: SessionOpts ) {
		const config = session.config.value;
		const socket =
			io( baseUrl, {
				rejectUnauthorized: false,
				reconnectionAttempts: config.maxReconnectionAttempts,
				reconnectionDelay: config.reconnectionDelay,
				transports: config.socketioTransports,
				extraHeaders: {
					'User-Agent': userAgent,
					Cookie: session.jar.getCookieString( baseUrl )
				},
				agent: getAgent( baseUrl )
			} as ConnectOpts );

		await merge(
			of( 'connect', 'connection' )
			.pipe( mergeMap( e => fromEvent( socket, e ) ) ),
			fromEvent( socket, 'error' )
			.pipe( switchMap( err => throwError( err ) ) ),
			timer( connectTimeout )
			.pipe( switchMap( () => throwError( 'connect timeout' ) ) )
		).pipe( take( 1 ) ).toPromise();

		return new NodeBBSocket( { socket } );
	}

	public emit<T>( event: string, ...args: any[] ) {
		const { socket } = this;
		return merge(
			emit<T>( socket, event, ...args ),
			fromEvent( socket, 'error' )
			.pipe( switchMap( err => throwError( err ) ) ),
			timer( emitTimeout )
			.pipe( switchMap( () => throwError( 'emit timeout' ) ) )
		)
		.pipe( take( 1 ) )
		.toPromise();
	}

	public getEvent<T extends keyof NodeBB.EventMap>( event: T ): Observable<NodeBB.EventMap[T] & { event: T }> {
		const { socket } = this;
		return fromEvent<NodeBB.EventMap[T]>( socket, event )
		.pipe( map( args => ( { event, ...args } ) ) );
	}

	public socket: SocketIOClient.Socket;
}
