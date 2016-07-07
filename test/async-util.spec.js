const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ assert, expect } = chai,
	{ mock, stub, spy } = require( 'sinon' ),
	now = require( 'performance-now' );

chai.use( require( 'sinon-chai' ) );

describe( 'async-util', () => {
	const { wait, thenFinally } = require( '../out/async-util' );
	describe( 'wait', () => {
		it( 'resolves after a certain number of milliseconds', done => {
			const waitTime = 25,
				beforeTime = now();
			wait( waitTime ).then(
				() => {
					const afterTime = now(),
						deltaTime = afterTime - beforeTime;
					expect( deltaTime ).to.be.within( waitTime, waitTime + 100 );
				}
			).then( () => { done(); }, err => { done( err ); } );
		} );
	} );

	describe( 'thenFinally', () => {
		let handler;

		beforeEach( () => {
			handler = spy();
		} );

		it( 'runs handler after the promise resolves', done => {
			const promise = Promise.resolve();
			thenFinally( promise, handler )
				.then( () => {
					expect( handler ).to.have.been.calledOnce;
				}, err => {
					assert.fail( err );
				} )
				.then( () => {
					done();
				} );
			expect( handler ).not.to.have.been.called;
			promise
			.catch()
			.then( () => {
				expect( handler ).not.to.have.been.called;
			} );
		} );

		it( 'runs handler after the promise rejects', done => {
			const promise = Promise.reject();
			thenFinally( promise, handler )
				.then( () => {
					assert.fail();
				}, err => {
					expect( handler ).to.have.been.calledOnce;
				} )
				.then( () => {
					done();
				} );

			expect( handler ).not.to.have.been.called;
			promise
			.catch()
			.then( () => {
				expect( handler ).not.to.have.been.called;
			} );
		} );

		it( 'resolves to the same value as the promise', done => {
			const expected = {},
				promise = Promise.resolve( expected );
			thenFinally( promise, handler )
				.then( value => {
					expect( value ).to.equal( expected );
				}, () => {
					assert.fail();
				} )
				.then( () => {
					done();
				} );
		} );

		it( 'rejects with the same value as the promise', done => {
			const expected = {},
				promise = Promise.reject( expected );
			thenFinally( promise, handler )
				.then( () => {
					assert.fail();
				}, value => {
					expect( value ).to.equal( expected );
				} )
				.then( () => {
					done();
				} );
		} );
	} );
} );
