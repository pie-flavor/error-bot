import { EventEmitter } from 'events';

type Socket = SocketIOClient.Socket;

export class SocketEvents extends EventEmitter {
	constructor( private socket: Socket ) {
		super();
		for( let event of [ 'connect', 'disconnect', 'error' ] ) {
			socket.on( event, ( ...args ) => { this.emit( event, ...args ); } );
		}
	}
}
