import now = require( 'performance-now' );
import Priority from './priority';

export default class AsyncQueue<T> {
	constructor( public rate: number = 0 ) {}

	public enqueue( fn: () => T|PromiseLike<T>, priority: Priority = Priority.Normal ) {
		const { queue } = this;

		let fns = queue.get( priority );
		if( !fns ) {
			fns = [];
			queue.set( priority, fns );
		}
		fns.push( fn );
	}

	public dequeue(): () => Promise<T> {
		const { queue, rate } = this,
			time = now(),
			delta = time - this.lastDequeue;
		if( delta < rate ) {
			return null;
		}

		let fn: () => T|PromiseLike<T>;
		for( let priority = Priority.Highest; priority >= Priority.Lowest; --priority ) {
			const fns = queue.get( priority );
			if( fns ) {
				fn = fns.shift();
				if( fn ) {
					break;
				}
			}
		}

		if( fn ) {
			this.lastDequeue = now();
			return () => Promise.resolve( fn() );
		} else {
			return null;
		}
	}

	private lastDequeue: number;
	private queue = new Map<Priority, Array<() => T|PromiseLike<T>>>();
}
