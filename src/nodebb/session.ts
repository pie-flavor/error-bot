import { jar } from 'request';

export class NodeBBSession {
	public jar = jar();
	public config: NodeBBConfig;
}
