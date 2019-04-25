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

type ModuleName = 'async-queue';
type Params = ModuleParamsMap[ ModuleName ];

export default function( { moduleName, bus, delay, queue, retries }: Params ) {
	bus.pipe(
		filterType( 'enqueue_action' ),
		takeUntil( disposed )
	).subscribe( message => {
		queue.push( [ message.action, retries ] );
	} );

	interval( delay )
	.pipe(
		filter( () => queue.length > 0 ),
		exhaustMap( async () => {
			const [ fn, retries ] = queue.shift();
			try {
				await fn();
			} catch( ex ) {
				console.error( ex );
				if( retries > 0 ) queue.push( [ fn, retries - 1 ] );
			}
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
