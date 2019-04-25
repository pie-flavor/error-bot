declare module '~data/*.yaml';

declare module '~data/auth.yaml' {
	export const username: string;
	export const password: string;
}

declare module '~data/config.yaml' {
	export const userAgent: string;
	export const baseUrl: string;
	export const topicId: number;
	export const connectTimeout: number;
	export const emitTimeout: number;
	export const cycleDelay: number;
	export const actionDelay: number;
	export const retryDelay: number;
	export const proxy: string|undefined;
}
