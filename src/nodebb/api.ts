import NodeBBSession from './session';
import { get, post } from './rest';
import NodeBBSocket from './socket';

type SessionOpts = { session: NodeBBSession };
type SocketOpts = { socket: NodeBBSocket };

export async function getConfig( { session }: SessionOpts ) {
	const config =
		session.config =
		await get( {
			session,
			path: '/api/config',
			json: true
		} );

	return config;
}

async function ensureConfig( { session }: SessionOpts ) {
	if( !session.config ) {
		await getConfig( { session } );
	}
}

export namespace auth {
	export async function logOut( { session }: SessionOpts ) {
		await ensureConfig( { session } );
		await post( {
			session,
			path: '/logout'
		} );
	}

	export async function logIn( { session, username, password }: SessionOpts & { username: string, password: string } ) {
		await ensureConfig( { session } );
		await post( {
			session,
			path: '/login',
			form: { username, password }
		} );
		await getConfig( { session } );
	}
}

export namespace posts {
	export async function reply( { socket, tid, content, toPid = null, lock = false }: SocketOpts & { tid: number, content: string, toPid?: number, lock?: boolean } ) {
		return await socket.emit( 'posts.reply', { tid, content, toPid, lock } );
	}
}

export namespace topics {
	export async function bookmark( { socket, tid, index }: SocketOpts & { tid: number, index: number } ) {
		return await socket.emit( 'topics.bookmark', { tid, index } );
	}

	export async function markAsRead( { socket, tids }: SocketOpts & { tids: number|number[] } ) {
		return await socket.emit( 'topics.markAsRead', tids );
	}
}

export namespace modules {
	export namespace chats {
		export async function send( { socket, roomId, message }: SocketOpts & { roomId: string, message: string } ) {
			return await socket.emit( 'modules.chats.send', { roomId, message } );
		}
	}
}

export namespace meta {
	export namespace rooms {
		export async function leaveCurrent( { socket }: SocketOpts ) {
			return await socket.emit( 'meta.rooms.leaveCurrent' );
		}

		export async function enter( { socket }: SocketOpts & { enter: string } ) {
			return await socket.emit( 'meta.rooms.enter', { enter } );
		}
	}
}
