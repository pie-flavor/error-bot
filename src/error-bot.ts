import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';
import NodeBBApi from './nodebb-api';

import SocketQueue from './socket-queue';

import { wait } from './time';

import { Fsm, FsmState, FsmNullTransition, FsmPushTransition, FsmPopTransition } from './fsm';

import { topicId } from './config';

export default class ErrorBot {
	public async start() {
		return new Promise( async ( resolve, reject ) => {
			try {
				const session = new NodeBBSession,
					rest = new NodeBBRest,
					api = new NodeBBApi,
					{ username, password } = require( '../data/auth.json' );

				console.log( 'Logging in...' );
				await api.auth.logIn( { session, rest, username, password } );
				console.log( 'Logged in' );

				const socket = await NodeBBSocket.connect( { session } ),
					queue = new SocketQueue,
					commands = new WeakMap<FsmState, { [ key: string ]: Function }>();

				queue.subscribe( socket.socket,
					'event:new_notification'
				);

				const fsm = new Fsm,
					listening = fsm.createState( 'listening' ),
					sleeping = fsm.createState( 'sleeping' ),
					paused = fsm.createState( 'paused' );

				listening.on( 'messageReceived', async ( { message }: IFsmMessageReceivedEventArgs ) => {
					await api.posts.reply( { socket, tid: topicId, content: message } );
				} );
				paused.transitions.set( 'pause', new FsmNullTransition );
				paused.transitions.set( 'unpause', new FsmPopTransition );
				sleeping.transitions.set( 'wake', new FsmPopTransition );
				sleeping.on( 'stateEnter', async ( { fsm }: IFsmStateEnterArgs ) => {
					await wait( 5000 );
					fsm.sendMessage( 'wake' );
				} );
				fsm.transitions.set( 'pause', new FsmPushTransition( paused ) );
				fsm.transitions.set( 'sleep', new FsmPushTransition( sleeping ) );
				fsm.pushState( listening );

				function choose<T>( opts: ArrayLike<T> ) {
					return opts[ Math.floor( Math.random() * opts.length ) ];
				}

				commands.set( listening, {
					async hello() {
						await api.posts.reply( { socket, tid: topicId, content: choose( [
							'Hello.',
							'Hey.',
							'Howdy.',
							'Hola.'
						] ) } );
					},
					async goodbye() {
						await api.posts.reply( { socket, tid: topicId, content: choose( [
							'Goodbye.',
							'Bye.',
							'Adiós.',
							'Ciao.'
						] ) } );
					}
				} );

				fsm.on( 'stateChange', async ( { previousState, nextState }: IFsmStateChangeArgs ) => {
					await api.posts.reply( { socket, tid: topicId, content: `Changing state: ${previousState} -> ${nextState}` } );
				} );

				for( ; ; ) {
					await wait( 20 );
					const [ event = null, args = [] ] = queue.dequeue() || [];
					if( !event ) { continue; }
					const [ { tid, pid, bodyLong } ] = args,
						[ , command = null ] = /@error_bot\s+(.*)$/.exec( bodyLong ) || [];
					if( !command ) {
						await api.posts.reply( { socket, tid, toPid: pid, content: `Command not understood` } );
						continue;
					}
					const currentCommands = commands.get( fsm.currentState );
					const fn = ( currentCommands && currentCommands[ command.toLowerCase() ] );
					if( fn ) {
						fn();
					} else {
						fsm.sendMessage( command );
					}
				}

				console.log( 'Logging out...' );
				await api.auth.logOut( { session, rest } );
				console.log( 'Logged out' );

				resolve();
			} catch( ex ) {
				reject( ex );
			}
		} );
	}
}

abstract class RespondMode {
	public name: string;


}
