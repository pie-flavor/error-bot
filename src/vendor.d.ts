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
