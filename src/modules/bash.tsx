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

type ModuleName = 'bash';
type Params = ModuleParamsMap[ ModuleName ];

interface BashProps {
	href: string;
	via?: string;
	text: string;
	id: string;
}

class Bash extends PureComponent<BashProps> {
	public constructor( props: BashProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		return (
			<div>
				<p>
					<a href={props.href} rel="noopener noreferrer" target="_blank">
						bash {props.id}
					</a>
				</p>
				<pre>
					{props.text}
				</pre>
				{ props.via
				? <p>
					(via{' '}
						<a href={props.via} target="_blank" rel="noopener noreferrer">
							{props.via}
						</a>
					)
				</p> : null }
			</div>
		);
	}
}

export default async function( { moduleName, socket, bus, commandFilter = {} }: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!bash(?:\.org)?\b/i, ...commandFilter } ),
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
			let num: number;
			let url: string;
			let via: string;
			if( /^#?\d+$/.test( params ) ) {
				num = parseInt( params.replace( /^#/, '' ), 10 );
			}
			if( num && isFinite( num ) ) {
				url = tagUrl`http://www.bash.org/?${num}`;
			} else {
				switch( params ) {
				case '':
				case 'random':
					via = url = `http://www.bash.org/?random`;
					break;
				default:
					via = url = tagUrl`http://www.bash.org/?search=${params}&sort=0&show=1`;
				}
			}
			const body = await rp( url, { agent: getAgent( url ), headers, method: 'GET' } );
			const { window: { document } } = new JSDOM( body );
			const link = document.querySelector( '.quote a' ) as HTMLAnchorElement;
			if( !link ) return;
			const href = new URL( link.href, url ).href;
			const id = link.textContent;
			const t = document.querySelector( '.quote + .qt' ).textContent
			const content = render( <Bash href={href} id={id} text={t} via={via}/> ).outerHTML;
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
