declare module 'striptags' {
	export default function striptags( str: string ): string;
}

declare module 'complex.js' {
	type ComplexDescriptor =
		{ re: number, im: number }
	|	{ arg: number, abs: number }
	|	{ phi: number, r: number }
	|	[ number, number ]
	|	number
	|	string;
	export default class Complex {
		constructor( re: number, im: number );
		constructor( d: ComplexDescriptor );

		public re: number;
		public im: number;

		public abs(): number;
		public add( exp: ComplexDescriptor|Complex ): Complex;
		public pow( exp: ComplexDescriptor|Complex ): Complex;
	}
}

declare namespace __WebpackModuleApi {
	interface RequireContext {
		id: string;
	}
}
