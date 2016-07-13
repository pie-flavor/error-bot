import AsyncQueue from '../async-queue';
import { wait } from '../async-util';
import { retryDelay } from '../config';

export default async function<T>( queue: AsyncQueue<T> ) {
	let working = false;

	return {
		tick() {
			if( working ) {
				return;
			}
			const promise = queue.dequeue();
			if( !promise ) {
				return;
			}
			working = true;
			( async function() {
				for( let i = 0; i < 5; ++i ) {
					try {
						await promise();
						break;
					} catch( ex ) {
						console.error( ex );
						await wait( retryDelay );
					}
				}
				working = false;
			} )();
		}
	};
};
