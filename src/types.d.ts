declare module '~src/modules/*';

declare type Func<T, U> = ( value: T ) => U;
declare type Eventually<T = {}> = Promise<T>|T;
declare type Action<T> = Func<T, Eventually>;
declare type Factory<T, U = void> = Func<U, T>;
declare type Predicate<T> = Func<T, boolean>;
declare type Match<T> = { [ K in keyof T ]?:
	T[K] extends string ? T[K]|RegExp|Predicate<string>|readonly T[K][]
	: T[K] extends Function ? T[K]
	: T[K] extends Array<any> ? T[K]|Predicate<T[K]>
	: T[K]|Predicate<T[K]>|readonly T[K][]
};
declare type Omit<T, U> = Pick<T, Exclude<keyof T, U>>;
declare type FalsyValue = false|0|''|void;

declare type PickOnly<TType, TKey extends keyof TType> =
	Pick<TType, TKey> &
	Partial<Record<Exclude<keyof TType, TKey>, void>>;
