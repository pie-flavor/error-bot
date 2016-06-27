import { wait } from '../async-util';
import actionQueue from '../action-queue';
import { actionDelay } from '../config';
import { thenFinally } from '../async-util';

async function tick() {
	if( actionQueue.length < 1 ) {
		return;
	}
	const action = actionQueue.shift();
	try {
		let promise = action() || Promise.resolve();
	} catch( ex ) {
		promise = Promise.reject( ex );
	}
	thenFinally( promise, () => wait( actionDelay ) );
}

export default function *actionModule() {
	yield tick();
}
