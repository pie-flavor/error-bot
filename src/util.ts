import now from 'performance-now';
import striptags from 'striptags';
import _ from 'lodash';
import { Html5Entities } from 'html-entities';

const entities = new Html5Entities;

function tagImpl( fn: Func<string, string> ) {
	return 	( strings: readonly string[], ...keys: readonly any[] ) => {
		const max = Math.max( strings.length, keys.length );
		const out = [] as string[];
		for( let i = 0; i < max; ++i ) {
			const string = ( strings[ i ] == null ) ? '' : String( strings[ i ] );
			const key = ( keys[ i ] == null ) ? '' : String( keys[ i ] );
			out.push( string, fn( key ) );
		}
		return out.join( '' );
	};
}

export function escapeMarkdown( str: string ) {
	return str.replace( /\[|\]|\(|\)|\*|>|`|_|\\|@/g, s => `\\${s}` );
}

export const tagMarkdown = tagImpl( escapeMarkdown );

export function escapeHtml( str: string ) {
	return entities.encode( str || '' );
}

export const tagHtml = tagImpl( escapeHtml );

export const tagUrl = tagImpl( encodeURIComponent );

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

interface NormalizeOptions {
	trim: boolean;
	collapse: boolean;
	striptags: boolean;
}

export function normalize( str: string, options?: Partial<NormalizeOptions> ) {
	options = _.merge( {
		trim: true,
		collapse: true,
		striptags: true
	} as NormalizeOptions, options );

	if( !str ) str = '';
	if( options.striptags ) str = striptags( str );
	str = str.replace( /\r\n?/g, '\n' );
	if( options.collapse ) str = str.replace( /[^\S\n]+/g, ' ' ).replace( /\n+/g, '\n' );
	if( options.trim ) str = str.replace( /^[^\S\n]+|[^\S\n]+$/gm, '' );

	return str;
}

export function sleep( ms: number ) {
	return new Promise( resolve => {
		setTimeout( () => { resolve(); }, ms );
	} );
}

export async function timeout( ms: number ): Promise<never> {
	await sleep( ms );
	throw new Error( 'Timeout' );
}

export function getTimeout<T>( fn: PromiseLike<T>, ms: number ) {
	return Promise.race<T>( [ Promise.resolve( fn ), timeout( ms ) ] );
}
