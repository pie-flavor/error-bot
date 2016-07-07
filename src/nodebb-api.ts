import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';

type SessionOpts = { session: NodeBBSession };
type RestOpts = SessionOpts & { rest: NodeBBRest };
type SocketOpts = { socket: NodeBBSocket };

export async function getConfig( { session, rest }: RestOpts ) {
	const config =
		session.config =
		await rest.get( {
			session,
			path: '/api/config',
			json: true
		} );

	return config;
}

async function ensureConfig( { session, rest }: RestOpts ) {
	if( !session.config ) {
		await getConfig( { session, rest } );
	}
}

export namespace auth {
	export async function logOut( { session, rest }: RestOpts ) {
		await ensureConfig( { session, rest } );
		await rest.post( {
			session,
			path: '/logout'
		} );
	}

	export async function logIn( { session, rest, username, password }: RestOpts & { username: string, password: string } ) {
		await ensureConfig( { session, rest } );
		await rest.post( {
			session,
			path: '/login',
			form: { username, password }
		} );
		await getConfig( { session, rest } );
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
