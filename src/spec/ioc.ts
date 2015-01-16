/// <reference path="../def/all.d.ts"/>

import Ioc = require( '../ioc' );
import assert = require( 'assert' );
import vows = require( 'vows' );

class Example {
	constructor( ...params ) {
		this.param1 = params[ 0 ];
		this.param2 = params[ 1 ];
		this.param3 = params[ 2 ];
	}

	public param1: any;
	public param2: any;
	public param3: any;
}

class Foo extends Example {
}

class Bar extends Example {}

vows.describe( 'IoC' ).addBatch( {
	'Building a circular reference': {
		topic() {
			var ioc = new Ioc;
			ioc.setFactory( '$circ1', $circ2 => null );
			ioc.setFactory( '$circ2', $circ1 => null );
			ioc.setFactory( '$circ3', $circ3 => null );
			return ioc;
		},
		'should throw an error': ( ioc: Ioc ) => {
			assert.throws( () => ioc.build( '$circ1' ) );
			assert.throws( () => ioc.build( '$circ2' ) );
			assert.throws( () => ioc.build( '$circ3' ) );
		}
	},
	'Building a missing factory': {
		topic() {
			return new Ioc;
		},
		'should return null': ( ioc: Ioc ) => {
			assert.isNull( ioc.build<Foo>( '$foo' ) );
		}
	},
	'Building an instance': {
		topic() {
			var ioc = new Ioc;
			ioc.setFactory( '$foo', () => new Foo );
			ioc.setFactory( '$bar', $foo => new Bar( $foo ) );
			return ioc;
		},
		'should return the correct type': ( ioc: Ioc ) => {
			assert.instanceOf( ioc.build<Foo>( '$foo' ), Foo );
			assert.instanceOf( ioc.build<Bar>( '$bar' ), Bar );
		},
		'should return a new instance': ( ioc: Ioc ) => {
			assert.notEqual( ioc.build( '$foo' ), ioc.build( '$foo' ) );
			assert.notEqual( ioc.build( '$bar' ), ioc.build( '$bar' ) );
		},
		'should supply the correct parameters': ( ioc: Ioc ) => {
			var $foo = ioc.build<Foo>( '$foo' ),
				$bar = ioc.build<Bar>( '$bar' );
			assert.isUndefined( $foo.param1 );
			assert.isUndefined( $foo.param2 );
			assert.isUndefined( $foo.param3 );
			assert.instanceOf( $bar.param1, Foo );
			assert.isUndefined( $bar.param2 );
			assert.isUndefined( $bar.param3 );
		}
	},
	'Unsatisfiable parameters': {
		topic() {
			var ioc = new Ioc;
			ioc.setFactory( '$foo', $bar => new Foo( $bar ) );
			return ioc;
		},
		'should supply null': ( ioc: Ioc ) => {
			var $foo = ioc.build<Foo>( '$foo' );
			assert.isNull( $foo.param1 );
		}
	}
} ).run();