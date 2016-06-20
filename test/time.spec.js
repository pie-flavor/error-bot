const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ expect } = chai;

function now() {
	const [ sec, nanoSec ] = process.hrtime();
	return sec * 1e3 + nanoSec / 1e6;
}

describe( 'time', () => {
	const time = require( '../out/time' );
	describe( 'wait', () => {
		it( 'resolves after a certain number of milliseconds', done => {
			const waitTime = 25,
				beforeTime = now();
			time.wait( waitTime ).then(
				() => {
					const afterTime = now(),
						deltaTime = afterTime - beforeTime;
					expect( deltaTime ).to.be.within( waitTime, waitTime + 100 );
				}
			).then( () => { done(); }, err => { done( err ); } );
		} );
	} );
} );
