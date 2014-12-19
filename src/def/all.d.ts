/// <reference path="tsd.d.ts" />
/// <reference path="reference.d.ts" />

declare module 'q-io/http-cookie' {
	export interface Cookie {
		key: string;
		value: string;
		domain?: string;
		path?: string;
		expires?: Date;
		secure?: boolean;
		httpOnly?: boolean;
	}

	export function parse( cookie: string ): Cookie;
}

declare module Q {
	export interface Promise<T> {
		tap( f: { ( t: T ) } ): Promise<T>;
	}
}

declare module 'url2' {
	export interface Url {
		protocol: string;
		slashes: any;
		auth: string;
		host: string;
		port: number;
		hostname: string;
		hash: string;
		search: string;
		query: string;
		pathname: string;
		path: string;
		href: string;
	}

	export interface Url2 extends Url {
		root: boolean;
		relative: string;
		directories: Array<string>;
		file: string;
	}

	export function resolve();

	export function resolveObject();

	export function relativeObject( source: string, target: string ): Url2;

	export function relative( source: string, target: string ): string;

	export function parse( url: string ): Url2;

	export function format( url: Url ): string;
	export function format( url: Url2 ): string;
}

declare module 'node.extend' {
	function extend( obj: Object, ...objs: Array<Object> ): Object;

	export = extend;
}

declare module 'node-uuid' {
	export function v4(): string;
}

declare module 'q-io/http-apps' {
	export function CookieJar( app: ( request: QioHTTP.Request ) => Q.Promise<QioHTTP.Response> ): ( request: QioHTTP.Request ) => Q.Promise<QioHTTP.Response>;

}
