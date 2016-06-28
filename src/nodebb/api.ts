import Session from './session';
import Rest from './rest';
import Socket from './socket';

type SessionOpts = { session: Session };
type RestOpts = SessionOpts & { rest: Rest };
type SocketOpts = { socket: Socket };

async function getConfig( { session, rest }: RestOpts ) {
	return session.config =
		await rest.get( {
			session,
			path: '/api/config',
			json: true
		} );
}

async function ensureConfig( { session, rest }: RestOpts ) {
	if( !session.config ) {
		await getConfig( { session, rest } );
	}
}

export default class Api {
	public async getConfig( { session, rest }: RestOpts ) {
		return await getConfig( { session, rest } );
	}

	public auth = new class {
		public async logOut( { session, rest }: RestOpts ) {
			await ensureConfig( { session, rest } );
			await rest.post( {
				session,
				path: '/logout'
			} );
		}

		public async logIn( { session, rest, username, password }: RestOpts & { username: string, password: string } ) {
			await ensureConfig( { session, rest } );
			await rest.post( {
				session,
				path: '/login',
				form: { username, password }
			} );
			await getConfig( { session, rest } );
		}
	};

	public posts = new class {
		public async reply( { socket, tid, content, toPid = null, lock = false }: SocketOpts & { tid: number, content: string, toPid?: number, lock?: boolean } ) {
			return await socket.emit( 'posts.reply', { tid, content, toPid, lock } );
		}
	};
}
