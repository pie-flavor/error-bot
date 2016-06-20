import { EventEmitter } from 'events';

type Socket = SocketIOClient.Socket;

type QueuedMessage = [ string, any[] ];

export default class SocketQueue extends EventEmitter {
	public subscribe( socket: Socket, ...events: string[] ) {
		for( let event of events ) {
			socket.on( event, ( ...args ) => { this.enqueue( event, args ); } );
		}
	}

	public get length() {
		return this._queue.length;
	}

	public peek() {
		const { _queue } = this;
		return _queue[ 0 ];
	}

	private enqueue( event: string, args: any[] ) {
		const { _queue } = this;
		_queue.push( [ event, args ] );
		this.emit( 'enqueue', event, ...args );
	}

	public dequeue() {
		const { _queue } = this;
		if( _queue.length < 1 ) {
			return null;
		}
		const [ event, ...args ] = _queue.shift();
		this.emit( 'dequeue', event, ...args );
		return [ event, ...args ];
	}

	private _queue: QueuedMessage[] = [];
}
