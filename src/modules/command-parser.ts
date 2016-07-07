import AsyncQueue from '../async-queue';

export default function( messageQueue: AsyncQueue<[ string, any[] ]>, commandQueue: AsyncQueue<void> ): Module {
	return {
		tick() {
			const promise = messageQueue.dequeue();
			if( !promise ) {
				return;
			}
			promise.then( ( [ message, args ] ) => {
				console.log( message, ...args );
			} );
		}
	};
};
