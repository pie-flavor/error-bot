/* jshint expr: true */

const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ expect } = chai,
	{ mock, stub, spy } = require( 'sinon' ),
	proxyquire = require( 'proxyquire' );

chai.use( require( 'sinon-chai' ) );

describe( 'start', () => {
	let startSpy = spy(),
		errorBotStub = stub().returns( { start: startSpy } );
	before( () => {
		proxyquire( '../out/start', { './error-bot': { default: errorBotStub, ErrorBot: errorBotStub } } );
	} );
	it( 'calls ErrorBot constructor', () => {
		expect( errorBotStub ).to.have.been.calledWithNew;
	} );
	it( 'calls the start method once', () => {
		expect( startSpy ).to.have.been.calledOnce;
	} );
} );
