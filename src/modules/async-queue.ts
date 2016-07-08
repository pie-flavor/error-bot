import AsyncQueue from '../async-queue';

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
			promise.then( () => { working = false; } );
		}
	};
};
