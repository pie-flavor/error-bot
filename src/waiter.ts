export default class Waiter {
	public emit( socket: SocketIOClient.Socket, event: string, ...args: any[] ) {
		return new Promise( ( resolve, reject ) => {
			socket.emit( event, ...args, ( err, ...data ) => {
				if( err ) {
					reject( err );
					return;
				}
				resolve( data );
			} );
		} );
	}

	public waitFor( socket: SocketIOClient.Socket, event: string ) {
		return new Promise( ( resolve, reject ) => {
			socket.once( event, ( err, data ) => {
				if( err ) {
					reject( err );
					return;
				}
				resolve( data );
			} );
		} );
	}
}
