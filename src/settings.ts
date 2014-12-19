/// <reference path="def/all.d.ts"/>

interface Settings {
	tasks: Array<TaskSettings>;
	latency: number;
	retryDelay: number;
	version: string;
	logLevel: string;
	proxy?: string;
	baseUrl: string;
	account: AccountSettings;
}

interface AccountSettings {
	username: string;
	password: string;
}

interface TaskSettings {
	methods: Array<{
		method: string;
		params?: Array<any>;
	}>;
	every: number;
	retries?: number;
}