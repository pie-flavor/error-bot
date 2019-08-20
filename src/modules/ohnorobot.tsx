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
import { string } from 'prop-types';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'ohnorobot';
type Params = ModuleParamsMap[ ModuleName ];

interface QwantzProps {
	url: string;
	via?: string;
	src: string;
	hiddenMessages: readonly string[];
}

class Qwantz extends PureComponent<QwantzProps> {
	public constructor( props: QwantzProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<details>
				<summary>
					Dinosaur Comics said in{' '}
					<a href={props.url} target="_blank" rel="noopener noreferrer">
						{props.url}
					</a>
				</summary>
				<p>
					<img src={props.src}/>
				</p>
				{ this.props.hiddenMessages.map( message => (
					<p>
						<small>{message}</small>
					</p>
				) ) }
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

interface SmbcProps {
	url: string;
	via?: string;
	src: string;
	title: string;
	hiddenSrc: string;
}

class Smbc extends PureComponent<SmbcProps> {
	public constructor( props: SmbcProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<details>
				<summary>
					<abbr title="Saturday Morning Breakfast Cereal">SMBC</abbr> Comics said in{' '}
					<a href={props.url} target="_blank" rel="noopener noreferrer">
						{props.url}
					</a>
				</summary>
				<p>
					<img src={props.src} title={props.title}/>
					<br/>
					<abbr title={props.title}>&shy;</abbr>
				</p>
				{ props.hiddenSrc
				? <p>
					<img src={props.hiddenSrc}/>
				</p> : null }
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

async function search( comicId: number, query: string ) {
	const headers = {
		'User-Agent': userAgent
	};
	const searchUrl = new URL( 'http://www.ohnorobot.com/index.php' );
	searchUrl.searchParams.set( 's', query );
	searchUrl.searchParams.set( 'Search', 'Search' );
	searchUrl.searchParams.set( 'comic', String( comicId ) );
	const via = searchUrl.href;
	const searchBody = await rp( via, { agent: getAgent( via ), headers, method: 'GET' } );
	const { window: { document: searchDocument } } = new JSDOM( searchBody );
	const url = new URL( ( searchDocument.querySelector( '.searchlink' ) as HTMLAnchorElement ).href, via ).href;
	const body = await rp( url, { agent: getAgent( url ), headers, method: 'GET' } );
	const { window: { document } } = new JSDOM( body );
return { via, url, body, document };
}

export default async function( { moduleName, session, socket, bus, commandFilter = {} }: Params ) {


	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!(?:dinosaur[-_]?comics|qwantz)\b/i, ...commandFilter } ),
		rateLimit( 10 ),
		concatMap( async ( {
			tid,
			pid,
			text
		} ) => {
			const comicId = 23;
			const firstSpace = text.search( /\s/ );
			const params = firstSpace >= 0 ? text.slice( firstSpace + 1 ) : '';

			const { via, url, body, document } = await search( comicId, params );
			const img = document.querySelector( '.comic' ) as HTMLImageElement;
			const src = new URL( img.src, url ).href;

			const hiddenMessages = [
				img.title,
				new URL( ( document.querySelector( '.topnav a[href^="mailto:"]' ) as HTMLAnchorElement ).href ).searchParams.get( 'subject' )
			];
			const commentSpanHtml = /<!--\s*(<span class="rss-title">\s*(.*?)\s*<\/span>)\s*-->/is.exec( body );
			if( commentSpanHtml ) {
				hiddenMessages.push( new JSDOM( commentSpanHtml[ 1 ] ).window.document.querySelector( 'span' ).textContent );
			}
			const content = render( <Qwantz url={url} src={src} hiddenMessages={hiddenMessages} via={via}/> ).outerHTML;
			bus.next( { type: 'enqueue_action', action: async () => {
				await api.posts.reply( { socket, tid, content, toPid: pid } );
			} } );
		} ),
		logError( moduleName ),
		retryWhen( err => err.pipe( delay( 100 ) ) ),
		takeUntil( disposed )
	).subscribe();

	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!(?:smbc(?:[-_]comics)?)\b/i, ...commandFilter } ),
		rateLimit( 10 ),
		concatMap( async ( {
			tid,
			pid,
			text
		} ) => {
			const comicId = 137;
			const firstSpace = text.search( /\s/ );
			const params = firstSpace >= 0 ? text.slice( firstSpace + 1 ) : '';
			let { via, url, document } = await search( comicId, params );
			const img = document.querySelector( '#cc-comic' ) as HTMLImageElement;
			const permaLink = img.closest( 'a' );
			if( permaLink ) url = new URL( permaLink.href, url ).href;
			const src = new URL( img.src, url ).href;
			const hiddenImg = document.querySelector( '#aftercomic img' ) as HTMLImageElement;
			let hiddenSrc = '';
			if( hiddenImg ) hiddenSrc = new URL( hiddenImg.src, url ).href;
			const content = render( <Smbc url={url} src={src} hiddenSrc={hiddenSrc} title={img.title} via={via}/> ).outerHTML;
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
