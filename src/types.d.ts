import { NodeBBSession } from '~nodebb/session';
import { NodeBBSocket } from '~nodebb/socket';
import { Observable, Observer } from 'rxjs';

declare module '~src/modules/*';

declare global {
	export type Func<T, U> = ( value: T ) => U;
	export type Eventually<T = {}> = Promise<T>|T;
	export type Action<T> = Func<T, Eventually>;
	export type Factory<T, U = void> = Func<U, T>;
	export type Predicate<T> = Func<T, boolean>;
	export type Dictionary<U, T extends keyof any = keyof any> = {
		[ K in T ]: U;
	};
	export type Match<T> = { [ K in keyof T ]?:
		T[K] extends string ? T[K]|RegExp|Predicate<string>|readonly T[K][]
		: T[K] extends Function ? T[K]
		: T[K] extends Array<any> ? T[K]|Predicate<T[K]>
		: T[K]|Predicate<T[K]>|readonly T[K][]
	};
	export type Omit<T, U> = Pick<T, Exclude<keyof T, U>>;
}
