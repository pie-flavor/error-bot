/// <reference path="def/all.d.ts"/>

class Ioc {
	private static getFunctionParameters( fn: Function ) {
		var str = Function.prototype.toString.call( fn );

		// TODO: handle inline comments within multi-line comments and vice versa
		str = str.replace( /\/\/.*?$/gm, '' ); // remove single-line comments
		str = str.replace( /[\r\n\s]/g, '' ); // remove whitespace
		str = str.replace( /\/\*.*?\*\//g, '' ); // remove multi-line comments

		return ( /\((.*?)\)/.exec( str )[ 1 ] || '' ).split( ',' );
	}

	public build<T>( factory: string, trace?: Array<string> ): T;
	public build<T>( factory: Factory<T>, trace?: Array<string> ): T;
	public build<T>( factory: any, trace: Array<string> = [] ): T {
		if( typeof factory === 'string' ) {
			if( trace.indexOf( factory ) >= 0 ) throw new Error( 'Circular dependency detected: ' + trace.concat( factory ).join( ' -> ' ) );
			trace.concat( factory );
			factory = this.getFactory<T>( <string>factory );
		}
		if( !factory ) return null;

		var params = Ioc.getFunctionParameters( factory ),
			supply = params.map( name => this.build( name, trace ) );

		return factory.apply( null, supply );
	}

	private factory: { [ name: string ]: Factory<any> } = {};

	public getFactory<T>( factory: string ): Factory<T> {
		if( !Object.prototype.hasOwnProperty.call( this.factory, factory ) ) return null;
		return this.factory[ factory ];
	}

	public setFactory<T>( name: string, factory: Factory<T> ): void {
		if( typeof factory !== 'function' && !( factory instanceof Function ) ) throw new Error( 'Factory must be a function' );
		this.factory[ name ] = factory;
	}

	public unsetFactory<T>( name: string ) {
		return delete this.factory[ name ];
	}

	public setInstance<T>( name: string, instance: T ): void {
		this.setFactory( name, () => instance );
	}
}

export = Ioc;
