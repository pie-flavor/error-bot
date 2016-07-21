import 'source-map-support/register';
import ErrorBot from './error-bot';

( async function() {
	Object.assign( process.env, {
		NODE_TLS_REJECT_UNAUTHORIZED: 0
	} );

	try {
		await ( new ErrorBot ).start();
		process.exit( 0 );
	} catch( ex ) {
		console.error( ex );
		process.exit( 1 );
	}
}() );
