import { NodeBBSession } from './nodebb/session';
import { NodeBBSocket } from './nodebb/socket';
import { auth } from './nodebb/api';

import { username, password } from '~data/auth.yaml';
import { Subject, NEVER, ReplaySubject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';

const modules = new Map<string, Subject<ModuleFactory>>();

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
}

function loadModules() {
	const requireContext = require.context( './modules', true, /(?<!\.d)\.tsx?$/ );
	for( const moduleKey of requireContext.keys() ) {
		const moduleName = moduleKey.replace( /^.\/|\.tsx?$/g, '' );
		const s = modules.get( moduleName ) || new ReplaySubject<ModuleFactory>( 1 );
		modules.set( moduleName, s );
		s.next( requireContext( moduleKey ).default as ModuleFactory );
		if( !module.hot ) {
			s.complete();
		}
	}
	if( module.hot ) module.hot.accept( requireContext.id, () => { loadModules(); } );
}

loadModules();

export async function errorBot() {
	const session = new NodeBBSession;

	console.log( 'Logging in...' );
	await auth.logIn( { session, username, password } );
	console.log( 'Logged in' );

	const bus = new Subject<BusMessage>();
	const socket = await NodeBBSocket.connect( { session } );

	async function startModule<TModuleName extends ModuleName>( moduleName: TModuleName, params: Omit<ModuleParamsMap[TModuleName], keyof ModuleParams> ) {
		modules.get( moduleName )
		.pipe(
			distinctUntilChanged(),
			map( m => async () =>
				await m( {
					...( params as any || {} ),
					moduleName,
					bus,
					session,
					socket
				} )
			),
			takeUntil( disposed )
		)
		.subscribe( factory => {
			factory();
		} );
	}

	startModule( 'async-queue', { delay: 1000, retries: 5, queue: [] } );
	startModule( 'fractal-gen', {} );


	startModule( 'xkcd', {} );

	startModule( 'casino', { tid: 14084 } );
	// Error_Bot in the Works
	startModule( 'playground', { tid: 14084 } );

	const games = [
		// TDWTF Plays Beyond Zork
		{ tid: 26508, url: 'ws://localhost:1338/ws/stdio' },
		// TDWTF Plays Enchanter
		{ tid: 26509, url: 'ws://localhost:1339/ws/stdio' },
		// TDWTF TDWTF Plays The Hitchhiker's Guide to the Galaxy
		{ tid: 20552, url: 'ws://localhost:1340/ws/stdio' },
		// TDWTF Plays Sorcerer
		{ tid: 20539, url: 'ws://localhost:1341/ws/stdio' },
		// TDWTF Plays Spellbreaker
		{ tid: 26510, url: 'ws://localhost:1342/ws/stdio' },
		// TDWTF Plays Zork I
		{ tid: 20461, url: 'ws://localhost:1343/ws/stdio' },
		// TDWTF Plays Zork II
		{ tid: 26506, url: 'ws://localhost:1344/ws/stdio' },
		// TDWTF Plays Zork III
		{ tid: 26507, url: 'ws://localhost:1345/ws/stdio' },
		// TDWTF Plays Zork: The Undiscovered Underground
		{ tid: 26511, url: 'ws://localhost:1346/ws/stdio' }
	];

	for( const { tid, url } of games ) {
		if( tid ) {
			startModule( 'cli-proxy', { tid, url } );
		}
	}

	console.log( 'Ready' );
	if( !await disposed.toPromise() ) { // falsy if no HMR
		await NEVER.toPromise(); // so wait forever
	}

	console.log( 'Logging out...' );
	await auth.logOut( { session } );
	console.log( 'Logged out' );
}
