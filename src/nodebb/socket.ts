import { fromEvent, of, throwError, timer, merge, Observable } from 'rxjs';
import { take, switchMap, mergeMap, map } from 'rxjs/operators';

import io from 'socket.io-client';

import { userAgent, baseUrl, connectTimeout, emitTimeout, proxy } from '~data/config.yaml';
import { NodeBBSession } from './session';
import HttpsProxyAgent from 'https-proxy-agent';

type ConnectOpts = SocketIOClient.ConnectOpts;
type SessionOpts = { session: NodeBBSession };

type Socket = SocketIOClient.Socket;

function emit( socket: Socket, event: string, ...args: any[] ) {
	return new Observable( observer => {
		socket.emit( event, ...args, ( err, ...data ) => {
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
	}

	public static async connect( { session }: SessionOpts ) {
		const socket =
			io( baseUrl, {
				rejectUnauthorized: false,
				transports: [ 'websocket', 'polling' ],
				extraHeaders: {
					'User-Agent': userAgent,
					'Cookie': session.jar.getCookieString( baseUrl )
				},
				agent: proxy && HttpsProxyAgent(proxy)
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

	public async emit( event: string, ...args: any[] ) {
		const { socket } = this;
		await merge(
			emit( socket, event, ...args ),
			fromEvent( socket, 'error' )
			.pipe( switchMap( err => throwError( err ) ) ),
			timer( emitTimeout )
			.pipe( switchMap( () => throwError( 'emit timeout' ) ) )
		).pipe( take( 1 ) ).toPromise();
	}

	public getEvent<T extends keyof NodeBB.EventMap>( event: T ): Observable<T & { event: T }> {
		const { socket } = this;
		return fromEvent<NodeBB.EventMap[T]>( socket, event )
		.pipe( map<T, T & { event: T }>( args => ( { event, ...args } ) ) );
	}

	public socket: SocketIOClient.Socket;
}

if( module.hot ) module.hot.accept( '../data/config.yaml' );
