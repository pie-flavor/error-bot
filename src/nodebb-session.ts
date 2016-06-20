import { jar } from 'request';

export default class NodeBBSession {
	public jar = jar();
	public config: INodeBBConfig;
}
