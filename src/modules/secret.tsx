import * as api from '~nodebb/api';
import { take, takeUntil, concatMap, filter, map } from 'rxjs/operators';
import { tapLog, rateLimit } from 'rxjs-util';
import { Subject } from 'rxjs';
import { normalize } from '~util';
import React from 'react';
import { render } from 'react-jsdom';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'secret';
type Params = ModuleParamsMap[ ModuleName ];

export default async function( { moduleName, socket, bus, tid }: Params ) {
	const cmdRe = /^!secret\b/i;
	socket.getEvent( 'event:chats.receive' )
	.pipe(
		map( ( { message: { cleanedContent: content, fromUser: { username, userslug } } } ) => ( { content: content.trim(), username, userslug } ) ),
		filter( ( { content } ) => cmdRe.test( content ) ),
		tapLog( 'secret' ),
		map( s => ( { ...s, content: normalize( s.content.replace( cmdRe, '' ) ) } ) ),
		rateLimit( 100 ),
		concatMap( async ( { content } ) => {
			bus.next( { type: 'enqueue_action', action: async () => {
				const secret = render(
					<div>
						<p>Somebody told me:</p>
						<blockquote>
							{ content }
						</blockquote>
					</div>
				).outerHTML;
				await api.posts.reply( { socket, tid, content: secret } );
			} } );
		} ),		
		takeUntil( disposed )
	)
	.subscribe();

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
// 