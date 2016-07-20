import { wait } from '../async-util';

import Schedule from '../schedule';

type FactoryOpts = {
	queue: Array<() => Promise<void>>;
	delay: number;
	attempts?: number;
	retryDelay: number;
};
const factory = async function( { queue, delay, attempts = 1, retryDelay }: FactoryOpts ) {
	const schedule = new Schedule;
	schedule.addTask( async () => {
		const promise = queue.shift();
		if( !promise ) {
			return { skip: true };
		}
		for( let i = 0; i < attempts; ++i ) {
			try {
				await promise();
				break;
			} catch( ex ) {
				console.error( ex );
				await wait( retryDelay );
			}
		}
	}, { interval: delay } );

	return schedule;
};

export default factory;
