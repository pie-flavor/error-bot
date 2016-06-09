import * as io from 'socket.io-client';

import NodeBBApi from './nodebb-api';

import { wait } from './time';

const wildcard = require('socketio-wildcard')( io.Manager );

export default class ErrorBot {
	public async start() {
		return new Promise( async ( resolve, reject ) => {
			const { baseUrl } = require( '../data/config.json' );
			console.log( `Connecting to ${baseUrl}...` );
			const socket = io( baseUrl );
			wildcard( socket );

			function emit( message: string, ...args ) {
				return new Promise( ( resolve, reject ) => {
					socket.emit( message, ...args, ( error, data ) => {
						if( error ) {
							reject( error );
						} else {
							resolve( data );
						}
					} );
				} );
			}

			socket.on( 'disconnect', () => {
				reject( new Error( 'Disconnected from server' ) );
			} );

			socket.on( '*', ( ...args ) => {
				console.log( ...args );
			} );

			socket.on( 'event:new_notification', data => {
				console.log( 'event:new_notification', data );
			} );

			await ( new Promise( resolve => {
				socket.on( 'connect', () => { resolve(); } );
			} ) );

			try {
				console.log( 'Connected' );

				const api = new NodeBBApi( baseUrl ),
					{ username, password } = require( '../data/auth.json' );

				console.log( 'Logging in...' );
				await api.logIn( username, password );
				console.log( 'Logged in' );

				console.log( 'Fetching config...' );
				const config = await api.getConfig();
				console.dir( config );

				const notifications = await emit( 'notifications.get', null );
				console.dir( notifications );

				await wait( 60 * 1000 * 5 );

				console.log( 'Logging out...' );
				await api.logOut();
				console.log( 'Logged out' );

				resolve();
			} catch( ex ) {
				reject( ex );
			}
		} );
	}
}
