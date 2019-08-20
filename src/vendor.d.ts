declare module 'striptags' {
	export default function striptags( str: string ): string;
}

declare module 'react-jsdom' {
	export function render( component: JSX.Element ): HTMLElement;
}

declare namespace __WebpackModuleApi {
	interface RequireContext {
		id: string;
	}
}

declare interface ObjectConstructor {
	fromEntries<T extends keyof any, K>( entries: [ T, K ][] ): Record<T, K>;
}

declare interface URLSearchParams {
	entries(): [ string, string ][];
}

declare module 'moment-duration-format' {
	import moment from 'moment';
	export default function momentDurationFormatSetup( m: typeof moment ): void;
}
