
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

class Foo extends Example {}

class Bar extends Example {}

vows.describe( 'IoC' ).addBatch( {
	'Building a circular reference should': {
		topic: () =>
			( new Ioc ).setFactories( {
				$circ1: $circ2 => null,
				$circ2: $circ1 => null,
				$circ3: $circ3 => null
			} ),
		'throw an error': ( ioc: Ioc ) => {
			assert.throws( () => ioc.build( '$circ1' ) );
			assert.throws( () => ioc.build( '$circ2' ) );
			assert.throws( () => ioc.build( '$circ3' ) );
		}
	},
	'Building a missing factory should': {
		topic: () => new Ioc,
		'return null': ( ioc: Ioc ) => {
			assert.isNull( ioc.build<Foo>( '$foo' ) );
		}
	},
	'Building an instance should': {
		topic: () =>
			( new Ioc )
			.setConstructor( '$foo', Foo )
			.setFactory( '$bar', $foo => new Bar( $foo ) ),
		'return the correct type': ( ioc: Ioc ) => {
			assert.instanceOf( ioc.build<Foo>( '$foo' ), Foo );
			assert.instanceOf( ioc.build<Bar>( '$bar' ), Bar );
		},
		'return a new instance': ( ioc: Ioc ) => {
			assert.notEqual( ioc.build<Foo>( '$foo' ), ioc.build<Foo>( '$foo' ) );
			assert.notEqual( ioc.build<Bar>( '$bar' ), ioc.build<Bar>( '$bar' ) );
		},
		'supply the correct parameters': ( ioc: Ioc ) => {
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
	'Building single should': {
		topic: () =>
			( new Ioc )
			.setConstructorSingle( '$foo', Foo )
			.setFactorySingle( '$bar', $foo => new Bar( $foo ) ),
		'return the correct type': ( ioc: Ioc ) => {
			assert.instanceOf( ioc.build<Foo>( '$foo' ), Foo );
			assert.instanceOf( ioc.build<Bar>( '$bar' ), Bar );
		},
		'return the same instance': ( ioc: Ioc ) => {
			assert.equal( ioc.build<Foo>( '$foo' ), ioc.build<Foo>( '$foo' ) );
			assert.equal( ioc.build<Bar>( '$bar' ), ioc.build<Bar>( '$bar' ) );
		}
	},
	'Specified parameters should': {
		topic: () =>
			( new Ioc )
			.setConstructor( '$foo', Foo )
			.setInstance( '$baz', 'baz' )
			.setFactory( '$bar', ( $foo, $baz, $qux ) => new Bar( $foo, $baz, $qux ) ),
		'be passed to the factory': ( ioc: Ioc ) => {
			var test = {},
				$bar = ioc.build( '$bar', {
					$qux: test
				} );
			assert.equal( $bar.param3, test );
		},
		'override supplied parameters': ( ioc: Ioc ) => {
			var test = {},
				$bar = ioc.build( '$bar', {
					$foo: test
				} );
			assert.equal( $bar.param1, test );
		},
		'not affect other supplied parameters': ( ioc: Ioc ) => {
			var test = {},
				$bar = ioc.build( '$bar', {
					$foo: test
				} );
			assert.equal( $bar.param2, 'baz' );
			assert.isNull( $bar.param3 );
		}
	},
	'Unsatisfiable parameters should': {
		topic: () =>
			( new Ioc )
			.setFactory( '$foo', $bar => new Foo( $bar ) ),
		'supply null': ( ioc: Ioc ) => {
			var $foo = ioc.build<Foo>( '$foo' );
			assert.isNull( $foo.param1 );
		}
	},
	'Unsetting a factory should': {
		topic: () => {
			var ioc =
				( new Ioc )
				.setConstructor( '$foo', Foo )
				.setFactory( '$bar', () => new Foo )
				.setInstance( '$baz', new Foo );

			ioc.unsetFactories( [ '$foo', '$qux' ] );
			ioc.unsetFactory( '$baz' );

			return ioc;
		},
		'clear the mapping': ( ioc: Ioc ) => {
			assert.isNull( ioc.build<Foo>( '$foo' ) );
			assert.isNull( ioc.build<Foo>( '$baz' ) );
		},
		'leave other mappings in place': ( ioc: Ioc ) => {
			assert.instanceOf( ioc.build<Foo>( '$bar' ), Foo );
		}
	},
	'Creating a factory that already exists should': {
		topic: () =>
			( new Ioc )
			.setFactory( '$foo', () => new Foo )
			.setFactory( '$foo', () => new Bar ),
		'replace the old mapping': ( ioc: Ioc ) => {
			assert.instanceOf( ioc.build<Bar>( '$foo' ), Bar );
		}
	}
} ).export( module );