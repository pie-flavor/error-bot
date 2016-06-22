type PromiseGetter<T> = ( context: T ) => Promise<void>;

export function retry<T>( count: number, promise: PromiseGetter<T> ) {
	return select<T>( ...Array.from( { length: count }, () => context => promise( context ) ) );
}

export function repeat<T>( promise: PromiseGetter<T>, count = Infinity ) {
	return async context => {
		for( ; count > 0; count-- ) {
			await promise( context );
		}
	};
}

export function select<T>( ...promises: PromiseGetter<T>[] ) {
	return context => {
		let all = Promise.reject( null );
		for( let promise of promises ) {
			all = all.then( null, () => promise( context ) );
		}
		return all;
	};
}

export function sequence<T>( ...promises: PromiseGetter<T>[] ) {
	return context => {
		let all = Promise.resolve();
		for( let promise of promises ) {
			all = all.then( () => promise( context ) );
		}
		return all;
	};
}

export function invert<T>( promise: PromiseGetter<T> ) {
	return context => promise( context ).then( () => Promise.reject( null ), () => { /* catch */ } );
}

export function succeed<T>( promise: PromiseGetter<T> ) {
	return context => promise( context ).then( null, () => { /* catch */ } );
}
