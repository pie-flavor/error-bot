import * as api from '~nodebb/api';
import { fromEvent, Subject, throwError, Observable, merge, pipe } from 'rxjs';
import { takeUntil, take, filter, switchMap, map, share, tap, startWith } from 'rxjs/operators';

import WebSocket from 'ws';
import { escapeMarkdown } from '~util';
import { tapLog, bufferDebounceTime, parseCommands, rateLimit } from '~rx';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type Params = ModuleParamsMap[ 'cli-proxy' ];

type Message = {
	data: string;
};

type BufferMessage = {
	name: 'stdin'|'stdout'|'stderr';
	data: string;
};

class Sock {
	private constructor(
		public readonly url: string,
		private readonly ws: WebSocket,
		public readonly message: Observable<BufferMessage>
	) {
	}

	public static async connect( url: string ) {
		console.log( `Connecting to ${url}...` );
		const ws = new WebSocket( url );

		const error =
			fromEvent( ws, 'error' )
			.pipe(
				tap( err => { console.error( err ); } ),
				switchMap( err => throwError( err ) )
			);

		const closed =
			merge(
				error,
				fromEvent( ws, 'close' )
			)
			.pipe(
				take( 1 ),
				tap( () => { console.log( `Disconnected from ${url}` ); } )
			);

		const open =
			merge(
				error,
				fromEvent( ws, 'open' )
			)
			.pipe(
				takeUntil( closed ),
				take( 1 ),
				tap( () => { console.log( `Connected to ${url}` ); } )
			);

		const message =
			merge(
				error,
				fromEvent<Message>( ws, 'message' )
			)
			.pipe(
				share(),
				takeUntil( closed ),
				map( ( { data } ) => JSON.parse( data ) ),
				tapLog( 'recv>' )
			);

		await open.toPromise();
		return new Sock( url, ws, message );
	}

	public close() {
		this.ws.close();
	}

	public write( msg ) {
		console.log( `send> ${JSON.stringify( msg )}` );
		this.ws.send( JSON.stringify( msg ) );
	}
}

const collectBuffer = () =>
	pipe(
		bufferDebounceTime<string>( 150 ),
		map( s =>
			s.join( '' )
			.split( /\r|\n/g )
			.map( s => s.trim() )
			.filter( s => !!s )
			.join( '\n' )
		),
		filter( s => !!s )
	);

export default async function( {
	socket,
	bus,
	url,
	tid,
	moduleName
}: Params ) {
	function writeln( content: string ) {
		content = escapeMarkdown( content || '' );
		bus.next( {
			type: 'enqueue_action',
			action: () => api.posts.reply( { socket, tid, content } )
		} );
	}

	const buffers = {
		stdout: new Subject<string>(),
		stderr: new Subject<string>()
	} as Dictionary<Subject<string>>;

	const sock = await Sock.connect( url );

	sock.message.pipe(
		takeUntil( disposed ),
		filter( ( { name } ) => buffers.hasOwnProperty( name ) )
	).subscribe( ( { name, data } ) => {
		buffers[ name ].next( data );
	} );

	buffers.stdout.pipe(
		takeUntil( disposed ),
		collectBuffer()
	).subscribe( cmd => {
		writeln( cmd );
	} );

	buffers.stderr.pipe(
		takeUntil( disposed ),
		collectBuffer()
	).subscribe( cmd => {
		console.error( cmd );
	} );

	disposed.pipe( take( 1 ) ).subscribe( () => {
		sock.close();
	} );

	socket.getEvent( 'event:new_notification' ).pipe(
		takeUntil( disposed ),
		parseCommands( {
			tid,
			text: s => !/^!/.test( s )
		} ),
		rateLimit( 10 )
	)
	.subscribe( ( { text } ) => {
		sock.write( { name: 'stdin', data: text + '\n' } );
	} );

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
