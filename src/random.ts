export function random( min: number, max: number ) {
	return Math.random() * ( max - min ) + min;
}

export function randomInt( min: number, max: number ) {
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

export function choose<T>( values: ArrayLike<T> ) {
	return values[ randomInt( 0, values.length ) ];
}

export function shuffle<T>( values: T[], inPlace = false ) {
	if( !inPlace ) {
		values = Array.from( values );
	}
	for( let i = values.length - 1; i > 0; --i ) {
		const j = randomInt( 0, i );
		[ values[ i ], values[ j ] ] = [ values[ j ], values[ i ] ];
	}
	return values;
}
