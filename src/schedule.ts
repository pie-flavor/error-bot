import now from 'performance-now';

type FnRetval = { delay: number; }|{ done: boolean; }|{ skip: boolean; };
type FnRetvalAll = { delay?: number; done?: boolean; skip?: boolean; };

type Fn = () => void|FnRetval|PromiseLike<void|FnRetval>;

type ScheduledTaskOpts = {
	delay: number;
	interval: number;
	times: number;
};

const defaultScheduledTaskOpts = { delay: 0, interval: 0, times: Infinity };

class ScheduledTask {
	constructor( private fn: Fn, {
		delay,
		times,
		interval
	}: ScheduledTaskOpts ) {
		this.nextDue = now() + delay;
		this.times = times;
		this.interval = interval;
	}

	public async run() {
		const { isDue, isDone, fn, interval } = this;
		if( isDone ) throw new Error( 'Task not active' );
		if( !isDue ) throw new Error( 'Task not due' );
		this.isBusy = true;

		try {
			const { delay = interval, done = false, skip = false } = ( await fn() || {} ) as FnRetvalAll;
			if( !skip ) {
				--this.times;
				this.nextDue = now() + delay;
			}
			if( done ) {
				this.times = 0;
			}
			return { delay, done: this.isDone, skip };
		} finally {
			this.isBusy = false;
		}
	}

	public get isDue() {
		return !this.isBusy && now() >= this.nextDue;
	}

	public get isDone() {
		const { times } = this;
		return times <= 0;
	}

	private isBusy: boolean = false;
	private times: number;
	public interval: number;
	public nextDue: number;
}

export class Schedule {
	public addTask( fn: Fn, opts?: Partial<ScheduledTaskOpts> ) {
		this.tasks.push( new ScheduledTask( fn, Object.assign( {}, opts, defaultScheduledTaskOpts ) ) );
	}

	private isBusy: boolean = false;
	public async runTask() {
		if( this.isBusy ) return;

		try {
			for( const task of this.dueTasks ) {
				this.isBusy = true;
				const { skip = false } = await task.run();
				if( !skip ) return;
			}
		} finally {
			this.isBusy = false;
		}
	}

	private get dueTasks() {
		return this.tasks
			.filter( t => !t.isDone && t.isDue )
			.sort( ( t1, t2 ) => t1.nextDue - t2.nextDue );
	}

	private tasks: ScheduledTask[] = [];
}
