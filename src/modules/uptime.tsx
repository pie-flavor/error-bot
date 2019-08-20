import * as api from '~nodebb/api';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import React, { PureComponent } from 'react';
import { render } from 'react-jsdom';

import { parseCommands } from '~rx';
import { rateLimit } from 'rxjs-util';


import { duration } from 'moment';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'uptime';
type Params = ModuleParamsMap[ ModuleName ];

interface UptimeProps {
	ms: number;
}

class Uptime extends PureComponent<UptimeProps> {
	public constructor( props: UptimeProps ) {
		super( props );
	}

	public render() {
		const { props } = this;
		const uptime = duration( props.ms, 'ms' );
		const iso = uptime.toISOString();
		const formatted = ( uptime as any ).format( 'y [years], d [days], h [hours], m [minutes], s [seconds]' );
		return (
			<p>
				I have been alive for
				{' '}
				<time dateTime={iso}>
					{formatted}
				</time>
				.
			</p>
		);
	}
}

export default async function( { moduleName, session, socket, bus, commandFilter = {} }: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		parseCommands( { text: /^!uptime\b/i, ...commandFilter } ),
		rateLimit( 10 ),
		takeUntil( disposed )
	).subscribe( ( { pid, tid } ) => {
		const content = render( <Uptime ms={process.uptime() * 1000}/> ).outerHTML;
		bus.next( { type: 'enqueue_action', action: async () => {
			await api.posts.reply( { socket, tid, content, toPid: pid } );
		} } );
	} );

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
