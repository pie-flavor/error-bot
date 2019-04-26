type PromiseGetter<T, R> = ( context: T ) => Promise<R>;

export function select<T, R>( ...promises: PromiseGetter<T, R>[] ) {
	return ( context: T ) => {
		let all = Promise.reject<R>( null );
		for( const promise of promises ) {
			all = all.then( null, () => promise( context ) );
		}
		return all;
	};
}

export function retry<T, R>( count: number, promise: PromiseGetter<T, R> ) {
	return select<T, R>( ...Array.from( { length: count }, () => context => promise( context ) ) );
}

export function repeat<T>( promise: PromiseGetter<T, any>, count = Infinity ) {
	return async ( context: T ) => {
		for( ; count > 0; count-- ) {
			await promise( context );
		}
	};
}

export function parallel<T, R>( ...promises: PromiseGetter<T, R>[] ) {
	return ( context: T ) => Promise.all( promises.map( p => p( context ) ) );
}

export function sequence<T, R>( ...promises: PromiseGetter<T, R>[] ) {
	return ( context: T ) => {
		let all = Promise.resolve<R>( null );
		for( const promise of promises ) {
			all = all.then( () => promise( context ) );
		}
		return all;
	};
}

export function invert<T, R>( promise: PromiseGetter<T, R> ) {
	return ( context: T ) => promise( context ).then( () => Promise.reject( null ), () => { /* catch */ } );
}

export function succeed<T, R>( promise: PromiseGetter<T, R> ) {
	return ( context: T ) => promise( context ).then( null, () => { /* catch */ } );
}

export function dequeue<T, R>( queue: R[] ) {
	return ( context: T ) => new Promise<R>( ( resolve, reject ) => {
		if( queue.length < 1 ) {
			reject();
		} else {
			resolve( queue.shift() );
		}
	} );
}
