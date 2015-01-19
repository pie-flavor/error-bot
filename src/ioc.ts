/// <reference path="def/all.d.ts"/>

class Ioc {
	private static getFunctionParameters( fn: Function ) {
		var str = Function.prototype.toString.call( fn );

		// TODO: handle inline comments within multi-line comments and vice versa
		str = str.replace( /\/\/.*?$/gm, '' ); // remove single-line comments
		str = str.replace( /[\r\n\s]/g, '' ); // remove whitespace
		str = str.replace( /\/\*.*?\*\//g, '' ); // remove multi-line comments

		return ( ( /\((.*?)\)/.exec( str ) || [] )[ 1 ] || '' ).split( ',' ).filter( s => !!s );
	}

	private supply<T>( fn: Function, that: T, params: { [ name: string ]: any; } = {}, trace?: Array<string> ) {
		return fn.apply( that, Ioc.getFunctionParameters( fn ).map( name =>
			Object.prototype.hasOwnProperty.call( params, name )
				? params[ name ]
				: this.build( name, trace )
		) );
	}

	public buildNew<T>( ctor: Function, params?: { [ name: string ]: any; } ) {
		function c() {}
		c.prototype = Object.create( ctor.prototype );
		var instance = new c;
		this.supply( ctor, instance, params );
		return instance;
	}

	public build<T>( factory: string, params?: { [ name: string ]: any; }, trace?: Array<string> ): T;
	public build<T>( factory: Factory<T>, params?: { [ name: string ]: any; }, trace?: Array<string> ): T;
	public build<T>( factory: any, params?: { [ name: string ]: any; }, trace: Array<string> = [] ): T {
		if( typeof factory === 'string' ) {
			if( trace.indexOf( factory ) >= 0 ) throw new Error( 'Circular dependency detected: ' + trace.concat( factory ).join( ' -> ' ) );
			trace.push( factory );
			factory = this.getFactory<T>( <string>factory );
		}
		if( !factory ) return null;

		return this.supply( factory, null, params, trace );
	}

	private factory: { [ name: string ]: Factory<any> } = {};

	public getFactory<T>( factory: string ): Factory<T> {
		if( !Object.prototype.hasOwnProperty.call( this.factory, factory ) ) return null;
		return this.factory[ factory ];
	}

	public setFactory<T>( name: string, factory: Factory<T> ): Ioc {
		if( typeof factory !== 'function' && !( factory instanceof Function ) ) throw new Error( 'Factory must be a function' );
		this.factory[ name ] = factory;
		return this;
	}

	public setFactories<T>( factories: { [ name: string ]: Factory<T>; } ): Ioc {
		for( var name in factories ) if( Object.prototype.hasOwnProperty.call( factories, name ) ) {
			this.setFactory<T>( name, factories[ name ] );
		}
		return this;
	}

	public unsetFactory( name: string ): void {
		delete this.factory[ name ];
	}

	public unsetFactories( names: Array<string> ): void {
		Array.prototype.forEach.call( names, name => this.unsetFactory( name ) );
	}

	public setConstructor<T>( name: string, ctor: Function ): Ioc {
		this.setFactory<T>( name, () => this.buildNew<T>( ctor ) );
		return this;
	}

	public setConstructors<T>( ctors: { [ name: string ]: Function; } ): Ioc {
		for( var name in ctors ) if( Object.prototype.hasOwnProperty.call( ctors, name ) ) {
			this.setConstructor<T>( name, ctors[ name ] );
		}
		return this;
	}

	public setFactorySingle<T>( name: string, factory: Factory<T>, params?: { [ name: string ]: any; } ): Ioc {
		var instance: T;
		this.setFactory<T>( name, () => {
			if( instance === undefined ) instance = this.build( factory, params )
			return instance;
		} );
		return this;
	}

	public setFactoriesSingle<T>( singletons: { [ name: string ]: Factory<T>; }, params?: { [ name: string ]: any; } ): Ioc {
		for( var name in singletons ) if( Object.prototype.hasOwnProperty.call( singletons, name ) ) {
			this.setFactorySingle<T>( name, singletons[ name ], params );
		}
		return this;
	}

	public setConstructorSingle<T>( name: string, ctor: Function, params?: { [ name: string ]: any; } ): Ioc {
		var instance: T;
		this.setFactory<T>( name, () => {
			if( instance === undefined ) instance = this.buildNew( ctor, params )
			return instance;
		} );
		return this;
	}

	public setConstructorsSingle<T>( singletons: { [ name: string ]: Function; }, params?: { [ name: string ]: any; } ): Ioc {
		for( var name in singletons ) if( Object.prototype.hasOwnProperty.call( singletons, name ) ) {
			this.setConstructorSingle<T>( name, singletons[ name ], params );
		}
		return this;
	}

	public setInstance<T>( name: string, instance: T ): Ioc {
		this.setFactory( name, () => instance );
		return this;
	}

	public setInstances( instances: { [ name: string ]: any; } ): Ioc {
		for( var name in instances ) if( Object.prototype.hasOwnProperty.call( instances, name ) ) {
			this.setInstance( name, instances[ name ] );
		}
		return this;
	}
}

export = Ioc;
