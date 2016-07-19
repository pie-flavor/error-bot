import AsyncQueue from '../async-queue';
import { wait } from '../async-util';
import { retryDelay } from '../config';

import Schedule from '../schedule';

export default async function<T>( queue: AsyncQueue<T> ) {
	const schedule = new Schedule;
	schedule.addTask( async () => {
		const promise = queue.dequeue();
		if( !promise ) {
			return;
		}
		for( let i = 0; i < 5; ++i ) {
			try {
				await promise();
				break;
			} catch( ex ) {
				console.error( ex );
				await wait( retryDelay );
			}
		}
	}, { interval: 10 } );

	return {
		tick() {
			schedule.runTask();
		}
	};
};
