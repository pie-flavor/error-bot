/* jshint expr: true */

const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ expect } = chai;

describe( 'time', () => {
	const time = require( '../out/time' );
	describe( 'wait', () => {
		it( 'resolves after a certain number of milliseconds', done => {
			const waitTime = 25,
				[ , beforeTime ] = process.hrtime();
			time.wait( waitTime ).then(
				() => {
					const [ , afterTime ] = process.hrtime(),
						deltaTime = afterTime - beforeTime;
					expect( deltaTime / 1000 ).to.be.at.least( waitTime );
				}
			).then( () => { done(); }, err => { done( err ); } );
		} );
	} );
} );
