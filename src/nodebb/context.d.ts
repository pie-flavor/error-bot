import { NodeBBSession } from './session';
import { NodeBBSocket } from './socket';

declare global {
	export interface NodeBBContext {
		session: NodeBBSession;
		socket: NodeBBSocket;
	}
}
