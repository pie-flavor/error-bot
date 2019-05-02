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
	loadModuleDependencies();
	const requireContext = require.context( './modules', true, /(?<!\.d)\.ts$/ );
	for( const moduleKey of requireContext.keys() ) {
		const moduleName = moduleKey.replace( /^.\/|\.ts$/g, '' );
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

function loadModuleDependencies() {
	if( module.hot ) module.hot.accept( [
		'./data/config.yaml',
		'./random.ts',
		'./rx.ts',
		'./util.ts',
		'./nodebb/api.ts'
	], () => {
		loadModules();
	} );
}

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

	startModule( 'async-queue', { delay: 500, retries: 4, queue: [] } );
	startModule( 'fractal-gen', {} );


	startModule( 'xkcd', {} );
	// Error_Bot in the Works
	startModule( 'playground', { tid: 14084 } );

	const games = [
		// TDWTF Plays Zork I
		{ tid: 20461, url: 'ws://localhost:1338/ws/stdio' }
		// TDWTF Plays Sorcerer
		// { tid: 20539, url: 'ws://localhost:1339/ws/stdio' ] }
	];

	for( const { tid, url } of games ) {
		startModule( 'cli-proxy', { tid, url } );
	}

	console.log( 'Ready' );
	if( !await disposed.toPromise() ) { // falsy if no HMR
		await NEVER.toPromise(); // so wait forever
	}

	console.log( 'Logging out...' );
	await auth.logOut( { session } );
	console.log( 'Logged out' );
}
