const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ assert, expect } = chai,
	{ mock, stub, spy } = require( 'sinon' ),
	proxyquire = require( 'proxyquire' ),
	request = require( 'request' ),
	{ jar } = request,
	{ default: NodeBBSession } = require( '../out/nodebb-session' );

describe( 'NodeBBSession', () => {
	let session;

	beforeEach( () => {
		spy( request, 'jar' );
		session = new NodeBBSession;
	} );

	it( 'creates a new cookie jar', () => {
		expect( request.jar ).to.have.been.calledOnce;
		expect( session.jar ).to.be.instanceof( Object.getPrototypeOf( jar() ).constructor );
	} );

	afterEach( () => {
		request.jar.restore();
	} );
} );
