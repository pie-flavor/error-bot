import now from 'performance-now';

export function escapeMarkdown( str: string ) {
	return str.replace( /\[|\]|\(|\)|\*|>|`|_|\\|@/g, s => `\\${s}` );
}

const formatMsTable = [
	[ 1000, 'ms' ],
	[ 60, 's' ],
	[ 60, 'm' ],
	[ Infinity, 'h' ]
] as [ number, string ][];
export function formatMs( ms: number ) {
	let div: number;
	let suffix: string;
	for( [ div, suffix ] of formatMsTable ) {
		if( Math.abs( ms ) < div ) break;
		ms /= div;
	}
	return `${ms.toPrecision( 3 )}${suffix}`;
}

export function perfTest<T extends ( ...args: any ) => any>( name: string, fn: T ): T {
	return function( ...args ) {
		console.log( `${name} started` );
		const before = now();
		const retval = fn.apply( this, args );
		const elapsed = now() - before;
		console.log( `${name} took ${formatMs( elapsed )}` );
		return retval;
	} as T;
}

export function perfTestAsync<T extends ( ...args: any ) => Promise<any>>( name: string, fn: T ): T {
	return async function( ...args ) {
		console.log( `${name} started` );
		const before = now();
		const retval = await fn.apply( this, args );
		const elapsed = now() - before;
		console.log( `${name} took ${formatMs( elapsed )}` );
		return retval;
	} as T;
}
