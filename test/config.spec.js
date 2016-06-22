const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ assert, expect } = chai,
	proxyquire = require( 'proxyquire' );

describe( 'config', () => {
	let configObject = {};

	it( 'reads data/config.json', () => {
		const exportedObject = proxyquire( '../out/config', { '../data/config.json': configObject } );
		expect( exportedObject ).to.equal( configObject );
	} );
} );
