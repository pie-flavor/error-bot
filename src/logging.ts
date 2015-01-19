import q = require( 'q' );

module Logging {
	export interface Logger {
		log( level: LogLevel, s: string ): Q.IPromise<{}>;
	}

	class LoggerImpl implements Logger {
		constructor( level: LogLevel ) {
			this.level = level;
		}

		public log( level: LogLevel, s: string ): Q.IPromise<{}> {
			if( this.isLevelActive( level ) ) {
				return this.logImpl( s );
			} else {
				return q.resolve( null );
			}
		}

		protected logImpl( s: string ): Q.IPromise<{}> {
			return q.reject();
		}

		protected isLevelActive( level: LogLevel ) {
			return level >= this.level;
		}

		protected level: LogLevel;
	}

	export class FileLogger extends LoggerImpl implements Logger {
		constructor( level: LogLevel, filename: string ) {
			super( level );
			this.filename = filename;
		}

		protected logImpl( s: string ): Q.IPromise<{}> {
			return q.reject(); // TODO
		}

		private filename: string;
	}

	export class ConsoleLogger extends LoggerImpl implements Logger {
		protected logImpl( s: string ): Q.IPromise<{}> {
			console.log( s );
			return q.resolve( null );
		}
	}

	export class MultiLogger implements Logger {
		constructor( ...logs: Array<Logger> ) {
			this.logs = logs.slice( 0 );
		}

		public log( level: LogLevel, s: string ): Q.IPromise<{}> {
			return q.all( this.logs.map( log => log.log( level, s ) ) );
		}

		private logs: Array<Logger>;
	}

	export enum LogLevel {
		Debug,
		Info,
		Warn,
		Error,
		Fatal
	}
}

export = Logging;