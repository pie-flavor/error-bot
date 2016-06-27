export function wait( milliseconds: number ) {
	return new Promise<void>( resolve => {
		setTimeout( () => { resolve(); }, milliseconds );
	} );
}

export function retry<T>( promise: () => PromiseLike<T>, attempts: number ) {
	let retval = Promise.reject();
	while( attempts-- > 0 ) {
		retval = retval.catch( () => promise() );
	}
	return retval;
}

export function thenAfter<T>( promise: PromiseLike<T>, resolveHandler: ( value: T ) => any, rejectHandler: ( err: any ) => any ): Promise<T> {
	return Promise.resolve( promise )
		.then( value => {
			if( resolveHandler ) {
				resolveHandler( value );
			}
		}, err => {
			if( rejectHandler ) {
				rejectHandler( err );
			}
		} )
		.catch()
		.then( () => promise );
}

export function thenFinally<T>( promise: PromiseLike<T>, fn: () => any ): Promise<T> {
	return thenAfter( promise, fn, fn );
}
