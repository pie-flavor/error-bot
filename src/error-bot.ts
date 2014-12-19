/// <reference path="def/all.d.ts"/>

import q = require( 'q' );

import $fs = require( 'q-io/fs' );

import Logging = require( './logging' );

import Discourse = require( './discourse' );

import Time = require( './time' );

class ErrorBot {
	constructor( settings: Settings ) {
		this.settings = settings;
		this.logger = new Logging.ConsoleLogger( Logging.LogLevel[ settings.logLevel ] );
		this.session = new Discourse.Session( this.settings );
	}

	public run() {
		q.onerror =
			err => {
				console.error( err );
			};

		this.tasks = this.settings.tasks.map( taskSettings => new Task( taskSettings ) );

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
	constructor( settings: TaskSettings ) {
		this.settings = settings;
		this.timer = new Time.StopWatch;
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

$fs.read( 'data/settings.json' )
.then( settings => {
	new ErrorBot( JSON.parse( settings ) ).run();
} );
