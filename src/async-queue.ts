import { retry, thenAfter, thenFinally } from './async-util';

export default class AsyncQueue {
	public enqueue<T>( fn: () => T|PromiseLike<T>, attempts = 1 ) {
		return Promise.resolve( this.onEnqueue() )
			.catch()
			.then( () => new Promise<T>( ( resolve, reject ) => {
				const run = () => {
					return new Promise<T>( ( resolve, reject ) =>
						Promise.resolve( this.onBeforeEach() )
							.catch()
							.then( () =>
								thenFinally(
									Promise.resolve( fn() ),
									() => this.onAfterEach()
								)
							)
					);
				};

				this._queue =
					thenAfter(
						thenAfter( this._queue,
							() => this.onDequeue()
						).then( retry( run, attempts ) ),
						 val => {
							 resolve( val );
							 return this.onResolve( val );
						 },
						 err => {
							 reject( val );
							 return this.onReject( err );
						 }
					).catch();
			} )
		);
	}

	public onEnqueue: () => void|PromiseLike<void> = () => Promise.resolve();

	public onDequeue: () => void|PromiseLike<void> = () => Promise.resolve();

	public onBeforeEach: () => void|PromiseLike<void> = () => Promise.resolve();

	public onAfterEach: () => void|PromiseLike<void> = () => Promise.resolve();

	public onResolve: ( val?: any ) => void|PromiseLike<void> = () => Promise.resolve();

	public onReject: ( err?: any ) => void|PromiseLike<void> = () => Promise.resolve();

	public onRetry: ( err?: any ) => void|PromiseLike<void> = () => Promise.resolve();

	public onEmpty: () => void = () => {};

	private _queue = Promise.resolve();
}
