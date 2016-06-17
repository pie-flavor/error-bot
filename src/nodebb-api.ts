import NodeBBSession from './nodebb-session';
import NodeBBRest from './nodebb-rest';
import NodeBBSocket from './nodebb-socket';

type SessionOpts = { session: NodeBBSession };
type RestOpts = SessionOpts & { rest: NodeBBRest };
type SocketOpts = SessionOpts & { socket: NodeBBSocket };

export default class NodeBBApi {
	public async getConfig( { session, rest }: RestOpts ) {
		return session.config =
			await rest.get( {
				session,
				path: '/api/config',
				json: true
			} );
	}

	private async ensureConfig( { session, rest }: RestOpts ) {
		if( !session.config ) {
			await this.getConfig( { session, rest } );
		}
	}

	public async logOut( { session, rest }: RestOpts ) {
		await this.ensureConfig( { session, rest } );
		await rest.post( {
			session,
			path: '/logout'
		} );
		session.reset();
	}

	public async logIn( { session, rest, username, password }: RestOpts & { username: string, password: string } ) {
		await this.ensureConfig( { session, rest } );
		await rest.post( {
			session,
			path: '/login',
			form: { username, password }
		} );
		await this.getConfig( { session, rest } );
	}
}
