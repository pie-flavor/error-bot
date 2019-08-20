import './bootstrap';

import { errorBot } from './error-bot';
import { Subject } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

const hmrReload = new Subject();
if( module.hot ) {
	module.hot.accept( './error-bot.ts', () => {
		hmrReload.next( true );
	} );
} else {
	hmrReload.complete();
}

( async function() {
	try {
		await hmrReload.pipe(
			startWith( true ),
			switchMap( () => errorBot() )
		).toPromise();
		process.exit( 0 );
	} catch( ex ) {
		console.error( ex );
		process.exit( 1 );
	}
}() );
