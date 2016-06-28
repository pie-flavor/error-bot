import { wait } from '../async-util';
import actionQueue from '../queues/action';
import { actionDelay } from '../config';

export default async function() {
	const action = actionQueue.shift();
	if( !action ) {
		return;
	}
	await Promise.resolve( action() ).catch( null );
	await wait( actionDelay );
};
