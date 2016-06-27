export function wait( milliseconds: number ) {
	return new Promise<void>( resolve => {
		setTimeout( () => { resolve(); }, milliseconds );
	} );
}

export function thenFinally<T>( promise: PromiseLike<T>, fn: () => any | PromiseLike<any> ): Promise<T> {
	return Promise.resolve( promise )
		.then( null, () => {} )
		.then( () => fn() )
		.then( null, () => {} )
		.then( () => promise );
}
