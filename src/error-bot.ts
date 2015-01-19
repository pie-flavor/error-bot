/// <reference path="def/all.d.ts"/>

import q = require( 'q' );

import $fs = require( 'q-io/fs' );
import $http = require( 'q-io/http' );
import $apps = require( 'q-io/http-apps' );

import Ioc = require( './ioc' );

import Logging = require( './logging' );

import Discourse = require( './discourse' );

import Time = require( './time' );

class ErrorBot {
	constructor( settings: Settings, logger: Logging.Logger, session: Discourse.Session, tasks: Array<Task> ) {
		this.settings = settings;
		this.logger = logger;
		this.session = session;
		this.tasks = tasks;
	}

	public run() {
		this.session.subscribe( '/topic/5556', data => {
			console.dir( data );
		} );

		this.queue = q.resolve( null );

		this.enqueue( () => this.heartbeat() );
	}

	private heartbeat() {
		this.tasks.forEach( task => {
			this.enqueue( () => task.accept( this ) );
		} );

		this.enqueue( () => Time.wait( this.settings.latency ) );
		this.enqueue( () => this.heartbeat() );
	}

	private tasks: Array<Task>;

	public queue: q.Promise<{}>;

	public settings: Settings;

	public session: Discourse.Session;

	public logger: Logging.Logger;

	public enqueue( task: () => any, retries = 0 ) {
		var fn = () => q.resolve( task() );

		this.queue = this.queue.then( fn );
		for( var i = 0; i < retries; ++i ) {
			this.queue = this.queue.then( undefined, () => Time.wait( this.settings.retryDelay ).then( fn ) );
		}
		this.queue.done();
	}
}

class Task {
	constructor( settings: TaskSettings, stopWatch: Time.StopWatch ) {
		this.settings = settings;
		this.timer = stopWatch;
	}

	accept( bot: ErrorBot ) {
		if( isNaN( this.timer.elapsed ) || this.timer.elapsed >= this.settings.every ) {
			this.settings.methods.forEach( methodInfo => {
				bot.enqueue( () =>
					bot.session[ methodInfo.method ].apply( bot.session, methodInfo.params )
				);
			} );
			this.timer.start();
		}
	}

	private settings: TaskSettings;
	private timer: Time.StopWatch;
}

q.onerror =
		err => {
	console.error( err );
};

$fs.read( 'data/settings.json' )
.then( settings => {
	settings = JSON.parse( settings );

	var ioc =
		( new Ioc )
			.setFactories( {
				logLevel: settings => settings.logLevel
			} )
			.setConstructors( {
				logger: Logging.ConsoleLogger,
				stopWatch: Time.StopWatch
			} )
			.setInstances( {
				settings: settings,
				requestHandlerFactory: () => $apps.CookieJar( $http.request )
			} )
			.setFactoriesSingle( {
				tasks: settings => settings.tasks.map( taskSettings =>
					ioc.buildNew( Task, { settings: taskSettings } )
				)
			} )
			.setConstructorsSingle( {
				session: Discourse.Session,
				bot: ErrorBot
			} );

	ioc.build<ErrorBot>( 'bot' ).run();
} );
