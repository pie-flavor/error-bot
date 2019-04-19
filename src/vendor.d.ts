declare module 'node-ansiparser' {
	export default class AnsiParser {
		constructor( terminal: {
			inst_p?: ( s ) => void,
			inst_o?: ( s ) => void,
			inst_x?: ( flag ) => void,
			inst_c?: ( collected, params, flag ) => void,
			inst_e?: ( collected, flag ) => void,
			inst_H?: ( collected, params, flag ) => void,
			inst_P?: ( data ) => void,
			inst_U?: () => void
		} );

		public parse( ansi: string ): void;
		public reset(): void;
	}
}

declare module 'striptags' {
	export default function striptags( str: string ): string;
}

declare const performance: {
	now(): number;
}
