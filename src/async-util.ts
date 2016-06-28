export function wait( milliseconds: number ) {
	return new Promise<void>( resolve => {
		setTimeout( () => { resolve(); }, milliseconds );
	} );
}

export function retry<T>( promise: () => PromiseLike<T>, attempts: number ) {
	let retval = Promise.reject<T>( null );
	while( attempts-- > 0 ) {
		retval = retval.catch( () => promise() );
	}
	return retval;
}

export function thenAfter<T>( promise: PromiseLike<T>, resolveHandler: ( value: T ) => PromiseLike<void>|void, rejectHandler?: ( err: any ) => PromiseLike<void>|void ): Promise<T> {
	Promise.resolve( promise )
		.then( value => {
			if( resolveHandler ) {
				return resolveHandler( value );
			}
		}, err => {
			if( rejectHandler ) {
				return rejectHandler( err );
			}
		} )
		.catch( null )
		.then( () => promise );

	return Promise.resolve( promise );
}

export function thenFinally<T>( promise: PromiseLike<T>, fn: () => PromiseLike<void>|void ): Promise<T> {
	return thenAfter( promise, fn, fn );
}
