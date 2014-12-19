var q = require( 'q' );
var now = require( 'performance-now' );

module Time {
	export class StopWatch {
		public static start() {
			var retval = new StopWatch;
			retval.start();
			return retval;
		}

		public start() {
			var retval = this.stop();
			this.startTime = now();
			this.elapsedTime = undefined;
			return retval;
		}

		public pause() {
			this.pauseTime = now();
		}

		public unpause() {
			if( this.pauseTime ) {
				this.startTime += ( now() - this.pauseTime );
				this.pauseTime = undefined;
			}
		}

		public get elapsed() {
			return this.elapsedTime || ( ( this.pauseTime || now() ) - this.startTime );
		}

		public stop() {
			return this.elapsedTime = this.elapsed;
		}

		private pauseTime: number;
		private startTime: number;
		private elapsedTime: number;
	}

	export function wait( milliseconds: number ) {
		return q.Promise( resolve => {
			setTimeout( () => resolve(), milliseconds );
		} );
	}
}

export = Time;