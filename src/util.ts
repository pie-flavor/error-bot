import now from 'performance-now';

export function escapeMarkdown( str: string ) {
	return str.replace( /\[|\]|\(|\)|\*|>|`|_|\\|@/g, s => `\\${s}` );
}

const formatMsTable = [
	[ 1000, 'ms' ],
	[ 60 * 1000, 's' ],
	[ 60 * 60 * 1000, 'm' ],
	[ Infinity, 'h' ]
] as [ number, string ][];
export function formatMs( ms: number ) {
	let div: number;
	let suffix: string;
	for( [ div, suffix ] of formatMsTable ) {
		if( Math.abs( ms ) < div ) break;
	}
	return `${( ms / div ).toPrecision( 2 )}${suffix}`;
}


export function perfTest<T>( name: string, fn: () => T ) {
	return () => {
		console.log( `${name} started` );
		const before = now();
		const retval = fn();
		const elapsed = now() - before;
		console.log( `${name} took ${formatMs( elapsed )}` );
		return retval;
	};
}

export function perfTestAsync<T>( name: string, fn: () => Promise<T> ) {
	return async () => {
		console.log( `${name} started` );
		const before = now();
		const retval = await fn();
		const elapsed = now() - before;
		console.log( `${name} took ${formatMs( elapsed )}` );
		return retval;
	};
}
