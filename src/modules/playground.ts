import { Subject, interval } from 'rxjs';
import { exhaustMap, takeUntil, take, filter } from 'rxjs/operators';
import { filterType } from '~rx';

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

export default function( { moduleName, bus, tid }: Params ) {


	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );

}
