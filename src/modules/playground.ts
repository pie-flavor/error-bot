/* eslint-disable */

import * as api from '~nodebb/api';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'playground';
type Params = ModuleParamsMap[ ModuleName ];

// this module is for experimentation and testing miscellaneous functionality

export default async function( { moduleName, session, socket, bus, tid }: Params ) {
	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
