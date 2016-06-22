type Socket = SocketIOClient.Socket;

export function emit( socket: Socket, event: string, ...args: any[] ) {
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

export function waitFor( socket: Socket, event: string ) {
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
