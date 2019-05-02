import { filter, tap, debounceTime, buffer, concatMap, map, window, delay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { normalize } from '~util';

function matchesValue<T, K extends keyof T = keyof T>( value: T[K], filterValue: Match<T>[K] ) {
	if( filterValue === undefined ) return true;
	if( value === filterValue ) return true;
	if( typeof filterValue === 'function' ) {
		return filterValue( value );
	}
	if( filterValue instanceof RegExp && typeof value === 'string' ) {
		return filterValue.test( String( value ) );
	}
	if( Array.isArray( filterValue ) ) {
		if( Array.isArray( value ) ) {
			return value.every( ( v, i ) => matchesValue<any>( v, filterValue[ i ] ) );
		} else {
			return filterValue.some( f => matchesValue( value, f ) );
		}
	}
	return false;
}

export const matches = <T extends object, U extends Match<T> = Match<T>>( obj: T, filter: U ): obj is T =>
	Object.entries( filter )
	.every( ( [ key, filterValue ] ) =>
		matchesValue<T>( obj[ key ], filterValue as any )
	);

export const matchesSome = <T extends object, U extends Match<T>>( obj: T, ...filters: readonly U[] ): obj is T =>
	filters.some( filter => matches( obj, filter ) );

export const filterMatches = <T extends object, U extends Match<T> = Match<T>>(
	...filters: readonly U[]
) =>
	filter<T>( obj => matchesSome<T, U>( obj, ...filters ) );

export const tapLog = <T>( ...prefixes ) =>
	tap<T>( {
		next: console.log.bind( 'next', ...prefixes ),
		error: console.log.bind( 'error', ...prefixes ),
		complete: console.log.bind( 'complete', ...prefixes )
	} );

export const replaceString = ( p: string|RegExp, v: string ) => map<string, string>( s => ( s || '' ).replace( p, v ) );
export const matchString = ( ...p: readonly ( string|RegExp )[] ) => filter<string>( s => p.some( p => s.match( p ) ) );
export const notMatchString = ( ...p: readonly ( string|RegExp )[] ) => filter<string>( s => !p.some( p => s.match( p ) ) );

type parseCommandRetval<T extends NodeBB.NewNotificationEvent> = { text: string } & Pick<T, 'datetime'|'cid'|'pid'|'tid'|'from'>;
export const parseCommands = <T extends NodeBB.NewNotificationEvent>( ...matches: readonly Match<parseCommandRetval<T>>[] ): { ( s: Observable<T> ): Observable<parseCommandRetval<T>> } =>
	s =>
	s.pipe(
		filter( x => x.type === 'mention' ),
		concatMap( ( { datetime, cid, pid, tid, bodyLong, from } ) =>
			of( bodyLong )
			.pipe(
				concatMap( s => normalize( s ).split( /\n/g ) ),
				notMatchString( /^@[-_\w\d]+\s+said\s+in\s+/i ),
				replaceString( /@error_bot/gi, '' ),
				notMatchString( /^[->@*]/ ),
				replaceString( /\[|\]|\(|\)|\*|>|`/g, '' ),
				map( s => normalize( s ) ),
				filter( s => !!s ),
				map( text => ( {
					datetime,
					cid,
					pid,
					tid,
					from,
					text
				} ) as parseCommandRetval<T> ),
				s => ( matches.length > 0 ) ? s.pipe( filterMatches( ...matches ) ) : s
			)
		)
	);

export const filterType = <T extends { type: string }, KTagValue extends T['type']> ( value: KTagValue ) => filter(
	( obj: T ): obj is Extract<T, { type: KTagValue }> =>
		obj.type === value
);

export const bufferDebounceTime = <T>( time: number ) =>
	( o: Observable<T> ) => o.pipe( buffer(
		o.pipe( debounceTime( time ) )
	) );

export const windowDebounceTime = <T>( time: number ) =>
	( o: Observable<T> ) => o.pipe( window(
		o.pipe( debounceTime( time ) )
	) );

export const rateLimit = <T>( time: number ) =>
	concatMap<T, Observable<T>>( data =>
		of( data ).pipe( delay( time ) )
	);

	// export function extractQueue<T extends NodeBB.EventName>( queue: NodeBB.EventQueue<T>, filter: Match<NodeBB.EventQueueEntry<T>> ) {
// 	const index = queue.findIndex( value => matches( value, filter ) );
// 	if( index < 0 ) return null;
// 	return queue.splice( index, 1 )[ 0 ] as NodeBB.EventQueueEntry<T>;
// }
