import * as api from '~nodebb/api';
import { take, delay, retryWhen } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';
import { parseCommands } from '~rx';
import { logError, rateLimit } from 'rxjs-util';

import { URL } from 'url';

import React, { PureComponent } from 'react';
import { render } from 'react-jsdom';

import { Card, Cards } from 'scryfall-sdk';
import { normalize, getTimeout } from '~util';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'scryfall';
type Params = ModuleParamsMap[ ModuleName ];

interface GathererProps {
	card: Card;
}

class Scryfall extends PureComponent<GathererProps> {
	public constructor( props: GathererProps ) {
		super( props );
	}

	public render() {
		const { props: { card } } = this;
		let href = '#';
		if( card.multiverse_ids ) {
			const multiverseId = card.multiverse_ids[ 0 ];
			if( multiverseId && isFinite( multiverseId ) ) {
				const url = new URL( 'https://gatherer.wizards.com/Pages/Card/Details.aspx' );
				url.searchParams.set( 'multiverseid', String( multiverseId ) );
				href = url.href;
			}
		}
		const src = card.image_uris.large || card.image_uris.normal || card.image_uris.png || card.image_uris.small;
		const alt = card.name;
		const title = [ card.name, card.type_line, card.oracle_text, card.flavor_text ].map( s => ( s || '' ).trim() ).filter( s => !!s ).join( '\r\n' );

		return (
			<div>
				<a href={href} target="_blank" rel="noopener noreferrer">
					<img
						src={src}
						alt={alt}
						title={title}
					/>
				</a>
			</div>
		);
	}
}

function isSuitableCard( card: Card ) {
	if( !card ) return false;
	if( !card.multiverse_ids ) return false;
	if( !card.name ) return false;
	if( !card.image_uris ) return false;
	return true;
}

async function *getCardById( id: number ) {
	try {
		yield await Cards.byMultiverseId( id );
	} catch( ex ) {
		console.error( ex );
	}
}

async function *getCard( query: string ) {
	if( /^[0-9]+$/.test( query ) ) {
		yield *getCardById( parseInt( query, 10 ) );
	}
	try {
		yield await Cards.byName( query );
	} catch( ex ) {
		console.error( ex );
	}
	try {
		const results = await getTimeout( Cards.search( query ).cancelAfterPage().waitForAll(), 5000 );
		for( const result of results ) {
			yield result;
		}
	} catch( ex ) {
		console.error( ex );
	}
}

export default async function( { moduleName, session, socket, bus, tid }: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!(?:magic|mtg)\b/i } ),
		rateLimit( 10 ),
		concatMap( async ( {
			tid,
			pid,
			text
		} ) => {
			const firstSpace = text.search( /\s/ );
			const params = normalize( firstSpace >= 0 ? text.slice( firstSpace + 1 ) : '' );
			if( !params ) return;
			let card: Card;
			try {
				for await( const result of getCard( params ) ) {
					if( isSuitableCard( result ) ) {
						card = result;
						break;
					}
				}
			} catch( ex ) {
				console.error( ex );
				return;
			}
			if( !isSuitableCard( card ) ) return;
			const content = render( <Scryfall card={card}/> ).outerHTML + '\r\n\r\n\u00ad<!-- fucking character limit -->\u00ad\r\n\u00ad';
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
