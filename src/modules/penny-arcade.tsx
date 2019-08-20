import * as api from '~nodebb/api';
import { take, delay, retryWhen } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';
import { parseCommands } from '~rx';
import { logError, rateLimit } from 'rxjs-util';
import rp from 'request-promise';
import { JSDOM } from 'jsdom';

import { userAgent } from '~data/config.yaml';

import React, { PureComponent } from 'react';
import { render } from 'react-jsdom';
import { getAgent } from '~proxy-agent';

import { URL } from 'url';
import { tagUrl } from '~util';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'penny-arcade';
type Params = ModuleParamsMap[ ModuleName ];

interface PennyArcadeProps {
	name: string;
	url: string;
	via?: string;
	src: string;
}

class PennyArcade extends PureComponent<PennyArcadeProps> {
	public constructor( props: PennyArcadeProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<details>
				<summary>
					Penny Arcade said in{' '}
					<a href={props.url} target="_blank" rel="noopener noreferrer">
						{props.url}
					</a>
				</summary>
				<h1>{props.name}</h1>
				<p>
					<img src={props.src} alt={props.name}/>
				</p>
				{ props.via
				? <p>
					(via{' '}
						<a href={props.via} target="_blank" rel="noopener noreferrer">
							{props.via}
						</a>
					)
				</p> : null }
			</details>
		);
	}
}

export default async function( { moduleName, session, socket, bus, commandFilter = {} }: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!(?:penny[-_]?arcade|pa)\b/i, ...commandFilter } ),
		rateLimit( 10 ),
		concatMap( async ( {
			tid,
			pid,
			text
		} ) => {
			const headers = {
				'User-Agent': userAgent
			};
			const firstSpace = text.search( /\s/ );
			const params = firstSpace >= 0 ? text.slice( firstSpace + 1 ) : '';
			let url: string;

			const searchUrl = new URL( 'https://www.penny-arcade.com/archive/results/search' );
			searchUrl.searchParams.set( 'keywords', params );
			const via = url = searchUrl.href;
			const body = await rp( url, { agent: getAgent( url ), headers, method: 'GET' } );

			const { window: { document } } = new JSDOM( body );
			const img = document.querySelector( '#results .img img' ) as HTMLImageElement;
			if( !img ) return;
			const name = document.querySelector( '#results h3' ).textContent;
			const src = new URL( img.src, url ).href;
			url = new URL( ( document.querySelector( '#results a[href]' ) as HTMLAnchorElement ).href, url ).href;
			const content = render( <PennyArcade name={name} url={url} src={src} via={via}/> ).outerHTML;
			bus.next( { type: 'enqueue_action', action: async () => {
				await api.posts.reply( { socket, tid, content, toPid: pid } );
			} } );
		} ),
		logError( moduleName ),
		retryWhen( err => err.pipe( delay( 100 ) ) ),
		takeUntil( disposed )
	).subscribe();

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
