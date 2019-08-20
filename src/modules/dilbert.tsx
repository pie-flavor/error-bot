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

type ModuleName = 'dilbert';
type Params = ModuleParamsMap[ ModuleName ];

interface DilbertProps {
	name: string;
	url: string;
	via?: string;
	src: string;
}

class Dilbert extends PureComponent<DilbertProps> {
	public constructor( props: DilbertProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<details>
				<summary>
					Dilbert said in{' '}
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
		parseCommands( { text: /^!dilbert\b/i, ...commandFilter } ),
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

			let via: string;

			if( /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test( params ) ) {
				url = tagUrl`https://dilbert.com/strip/${params}`;
			} else {
				switch( params ) {
				case '':
				case 'latest':
					via = url = `https://dilbert.com/`;
					break;
				default: { // search
					const searchUrl = new URL( 'https://dilbert.com/search_results' );
					searchUrl.searchParams.set( 'terms', params );
					via = url = searchUrl.href;
					break;
				} }
			}
			const body = await rp( url, { agent: getAgent( url ), headers, method: 'GET' } );

			const { window: { document } } = new JSDOM( body );
			const img = document.querySelector( '.img-comic' ) as HTMLImageElement;
			const name = document.querySelector( '.comic-title-name' ).textContent;
			const src = new URL( img.src, url ).href;
			url = new URL( ( document.querySelector( '.img-comic-link' ) as HTMLAnchorElement ).href, url ).href;
			const content = render( <Dilbert name={name} url={url} src={src} via={via}/> ).outerHTML;
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
