import * as api from '~nodebb/api';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { takeUntil, take, filter, map, groupBy, mergeMap } from 'rxjs/operators';

import WebSocket from 'ws';
import { escapeMarkdown } from '~util';
import { bufferDebounceTime, parseCommands, rateLimit } from '~rx';

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

type BufferMessage = {
	name: 'stdin'|'stdout'|'stderr';
	data: string;
};

export default async function( {
	socket,
	bus,
	url,
	tid,
	moduleName
}: Params ) {
	const ws = webSocket<BufferMessage>( {
		url,
		WebSocketCtor: WebSocket as any
	} );

	const buffers =
	ws.pipe(
		groupBy( g => g.name ),
		mergeMap( g =>
			g.pipe(
				map( ( { data } ) => data ),
				bufferDebounceTime<string>( 250 ),
				map( s =>
					s.join( '' )
					.split( /\r|\n/g )
					.map( s => s.trim() )
					.filter( s => !!s )
					.join( '\n' )
				),
				filter( s => !!s ),
				map( data => ( { name: g.key, data } ) )
			)
		),
		takeUntil( disposed )
	);

	buffers
	.subscribe( ( { name, data } ) => {
		console.log( `${name}> ${data}` );
	} );

	buffers.pipe(
		filter( ( { name } ) => name === 'stdout' ),
		rateLimit( 1000 )
	).subscribe( ( { data } ) => {
		const content = escapeMarkdown( data || '' );

		bus.next( {
			type: 'enqueue_action',
			action: async () => {
				console.log( `send> ${content}` );
				await api.posts.reply( { socket, tid, content } );
			}
		} );
	} );

	disposed.pipe( take( 1 ) ).subscribe( () => {
		ws.complete();
	} );

	socket.getEvent( 'event:new_notification' ).pipe(
		takeUntil( disposed ),
		parseCommands( {
			tid,
			text: s => !/^!/.test( s ) // ignore !commands
		} ),
		rateLimit( 10 )
	)
	.subscribe( ( { text } ) => {
		ws.next( { name: 'stdin', data: text + '\n' } );
	} );

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
