import { CookieJar, jar } from 'request';

export default class NodeBBSession {
	constructor() {
		this.reset();
	}

	public jar: CookieJar;
	public config: INodeBBConfig;

	public reset() {
		this.jar = jar();
		this.config = undefined;
	}
}
