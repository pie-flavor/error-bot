declare interface Action {
		(): void|PromiseLike<void>;
}
