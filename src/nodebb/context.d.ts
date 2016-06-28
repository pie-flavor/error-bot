import Session from './session';
import Socket from './socket';

declare global {
	export interface NodeBBContext {
		session: Session;
		socket: Socket;
	}
}
