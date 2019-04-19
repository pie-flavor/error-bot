import 'source-map-support/register';
import { ErrorBot } from './error-bot';

( async function() {
	try {
		const bot = new ErrorBot;
		await bot.start();
		process.exit( 0 );
	} catch( ex ) {
		console.error( ex );
		process.exit( 1 );
	}
}() );
