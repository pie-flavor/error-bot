/* eslint no-console: "off" */

const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ assert, expect } = chai,
	{ mock, stub, spy } = require( 'sinon' ),
	proxyquire = require( 'proxyquire' );

chai.use( require( 'sinon-chai' ) );

describe( 'start', () => {
	let errorBotCtor,
		errorBot,
		startResult = Promise.resolve();
	beforeEach( () => {
		errorBot = { start: stub().returns( startResult ) };
		errorBotCtor = stub().returns( errorBot );
		stub( process, 'exit' );
		stub( console, 'error' );
		proxyquire( '../out/start', { './error-bot': { default: errorBotCtor, ErrorBot: errorBotCtor } } );
	} );
	afterEach( () => {
		console.error.restore();
		process.exit.restore();
	} );
	it( 'calls ErrorBot constructor', () => {
		expect( errorBotCtor ).to.have.been.calledOnce.calledWithNew;
	} );
	it( 'calls the start method once', () => {
		expect( errorBot.start ).to.have.been.calledOnce;
	} );
	describe( 'success', () => {
		it( 'exits the process with code 0', () => {
			expect( process.exit ).to.have.been.calledOnce.calledWith( 0 );
		} );
		it( 'does not log any errors to the console', () => {
			expect( console.error ).not.to.have.been.called;
		} );
	} );
	describe( 'failure', () => {
		let error = new Error( 'foo bar' );
		before( () => {
			startResult = Promise.reject( error );
		} );
		it( 'exits the process with code 1', () => {
			expect( process.exit ).to.have.been.calledOnce.calledWith( 1 );
		} );
		it( 'logs error to the console', () => {
			expect( console.error ).to.have.been.calledOnce.calledWith( error );
		} );
	} );
} );
