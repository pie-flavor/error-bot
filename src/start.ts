import 'source-map-support/register';
import ErrorBot from './error-bot';

( async function() {
	try {
		await ( new ErrorBot ).start();
		process.exit( 0 );
	} catch( ex ) {
		console.error( ex );
		process.exit( 1 );
	}
}() );
