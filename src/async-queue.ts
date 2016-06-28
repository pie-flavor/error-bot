import { retry, thenAfter, thenFinally } from './async-util';

export default class AsyncQueue {
	public enqueue<T>( fn: () => T|PromiseLike<T>, attempts = 1 ) {
		return Promise.resolve( this.onEnqueue() )
			.catch( null )
			.then( () => new Promise<T>( ( resolve, reject ) => {
				const run = () => {
					return new Promise<T>( ( resolve, reject ) =>
						Promise.resolve( this.onBeforeEach() )
							.catch( null )
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
						thenFinally( this._queue, () => this.onDequeue() )
						.then( () => retry( run, attempts ) ),
						val => ( resolve( val ), this.onResolve( val ) ),
						err => ( reject( err ), this.onReject( err ) )
					).catch<void>( null );
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

	public onEmpty: () => void = () => { return; };

	private _queue = Promise.resolve();
}
