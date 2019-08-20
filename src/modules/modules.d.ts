import { NodeBBSession } from '~nodebb/session';

import { NodeBBSocket } from '~nodebb/socket';

import { Observer, Observable } from 'rxjs';

declare global {
	export type CommandFilter = Match<Pick<NodeBB.NewNotificationEvent, 'datetime'|'cid'|'pid'|'tid'|'from'>>;

	export interface CommandParserCommand {
		export: number;
		cid: number;
		pid: number;
		tid: number;
		from: number;
		text: string;
	}

	export type BusMessage = {
		type: 'unhandled_command';
		command: CommandParserCommand;
	} | {
		type: 'enqueue_action';
		action: () => Eventually;
	};

	export interface ModuleParams<TModuleName extends ModuleName = ModuleName> {
		moduleName: TModuleName;
		session: NodeBBSession;
		socket: NodeBBSocket;
		bus: Observer<BusMessage> & Observable<BusMessage>;
	}

	export interface ModuleParamsMap {
		'async-queue': ModuleParams<'async-queue'> & {
			delay: number;
			retries: number;
			queue: [ () => Eventually, number ][];
		};
		'bash': ModuleParams<'bash'> & {
			readonly commandFilter?: CommandFilter;
		};
		'casino': ModuleParams<'casino'> & {
			readonly commandFilter?: CommandFilter;
		};
		'cli-proxy': ModuleParams<'cli-proxy'> & {
			url: string;
			tid: number;
		};
		'dilbert': ModuleParams<'dilbert'> & {
			readonly commandFilter?: CommandFilter;
		};
		'fractal-gen': ModuleParams<'fractal-gen'> & {};
		'ohnorobot': ModuleParams<'ohnorobot'> & {
			readonly commandFilter?: CommandFilter;
		};
		'penny-arcade': ModuleParams<'penny-arcade'> & {
			readonly commandFilter?: CommandFilter;
		};
		'playground': ModuleParams<'playground'> & {
			readonly commandFilter?: CommandFilter;
		};
		'scryfall': ModuleParams<'scryfall'> & {
			readonly commandFilter?: CommandFilter;
		};
		'secret': ModuleParams<'secret'> & {
			tid: number;
		};
		'uptime': ModuleParams<'uptime'> & {
			readonly commandFilter?: CommandFilter;
		};
		'xkcd': ModuleParams<'xkcd'> & {
			readonly commandFilter?: CommandFilter;
		};
	}

	export type ModuleName = keyof ModuleParamsMap;

	export type ModuleFactory<T extends ModuleParams = ModuleParams> = Func<T, Eventually<void>>;
}
