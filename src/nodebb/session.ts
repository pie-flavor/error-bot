import { jar } from 'request';
import { BehaviorSubject } from 'rxjs';

export class NodeBBSession {
	public readonly jar = jar();
	public readonly config = new BehaviorSubject<NodeBBConfig>( null );
}
