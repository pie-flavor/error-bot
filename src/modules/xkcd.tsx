import * as api from '~nodebb/api';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';
import { parseCommands, rateLimit } from '~rx';
import rp from 'request-promise';
import { JSDOM } from 'jsdom';

import { proxy } from '~data/config.yaml';

import React, { PureComponent } from 'react';
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

type ModuleName = 'xkcd';
type Params = ModuleParamsMap[ ModuleName ];

interface XkcdProps {
	name: string;
	title: string;
	url: string;
	via?: string;
	src: string;
}

class Xkcd extends PureComponent<XkcdProps> {
	public constructor( props: XkcdProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<details>
				<summary>
					xkcd said in {props.url}
				</summary>
				<h1>{props.name}</h1>
				<p>
					<a href={props.url} target="_blank" rel="noopener noreferrer">
						<img src={props.src} title={props.title}/>
					</a>
					<br/>
					<abbr title={props.title}>&shy;</abbr>
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

export default async function( { moduleName, session, socket, bus, tid }: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		takeUntil( disposed ),
		parseCommands( { text: /^!xkcd\b/i } ),
		rateLimit( 10 ),
		concatMap( async ( {
			tid,
			pid,
			text
		} ) => {
			const firstSpace = text.search( /\s/ );
			const params = firstSpace >= 0 ? text.slice( firstSpace + 1 ) : '';
			let num: number;
			let url: string;

			let via: string;

			if( /^\d+$/.test( params ) ) {
				num = parseInt( params, 10 );
			}
			if( num && isFinite( num ) ) {
				url = `https://xkcd.com/${num}/`;
			} else {
				switch( params ) {
				case 'latest':
					via = url = `https://xkcd.com/`;
					break;
				case '':
				case 'random':
					via = url = 'https://c.xkcd.com/random/comic/';
					break;
				default: await ( async () => { // search
						const searchUrl = new URL( 'https://www.explainxkcd.com/wiki/index.php' );
						searchUrl.searchParams.set( 'search', params );
						searchUrl.searchParams.set( 'title', 'Special:Search' );
						searchUrl.searchParams.set( 'fulltext', '1' );
						via = searchUrl.href;
						const body = await rp( searchUrl.href, { proxy, method: 'GET' } );
						const { window: { document: searchDoc } } = new JSDOM( body );
						const bestResult =
							Array.from( searchDoc.querySelectorAll( '.mw-search-result-heading a[href]' ) as NodeListOf<HTMLAnchorElement> )
							.map( a => /\/wiki\/index\.php\/(\d+):/.exec( a.href ) )
							.filter( r => r != null )
							.map( r => r[ 1 ] )[ 0 ];
						if( bestResult ) url = `https://xkcd.com/${bestResult}/`;
						else via = url = 'https://c.xkcd.com/random/comic/';
					} )();
					break;
				}
			}
			let body: string;
			for( let i = 0; i < 3; ++i ) {
				const response = await rp( url, { followRedirect: false, proxy, method: 'GET', resolveWithFullResponse: true, simple: false } );
				const location = response.headers.location;
				if( location ) {
					url = location;
					continue;
				}
				if( response.statusCode !== 200 ) throw new Error( `Failed to load ${url}` );
				body = response.body;
				break;
			}
			const { window: { document } } = new JSDOM( body );
			const img = document.querySelector( '#comic img' ) as HTMLImageElement;
			const srcSet = new Map<string, string>();
			srcSet.set( '1x', img.src );
			const srcSets = ( img.srcset || '' ).split( ',' ).map( s => s.trim() ).filter( s => !!s );
			for( const ss of srcSets ) {
				if( ss === 'null' ) break;
				const [ src, size = '1x' ] = ss.split( /\s+/, 2 );
				if( src ) srcSet.set( size, src );
			}
			const name = document.querySelector( '#ctitle' ).textContent;
			const imgFullUrl = new URL( srcSet.get( '2x' ) || srcSet.get( '1x' ), url ).href;
			const content = render( <Xkcd name={name} title={img.title} url={url} src={imgFullUrl} via={via}/> ).outerHTML;
			bus.next( { type: 'enqueue_action', action: async () => {
				await api.posts.reply( { socket, tid, content, toPid: pid } );
			} } );
	} ) )
	.subscribe();

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
