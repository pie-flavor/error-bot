import AsyncQueue from './async-queue';
import NodeBBSocket from './nodebb/socket';
import NodeBBSession from './nodebb/session';

declare global {
	export interface ModuleFactory {
		( args: {
			socket: NodeBBSocket,
			session: NodeBBSession,
			messageQueue: AsyncQueue<[string, any[]]>,
			commandQueue: AsyncQueue<void>,
			actionQueue: AsyncQueue<void>
		} ): Promise<Module>;
	}
}
