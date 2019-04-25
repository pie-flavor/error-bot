import { NodeBBSession } from "~nodebb/session";

import { NodeBBSocket } from "~nodebb/socket";

import { Observer, Observable } from "rxjs";

declare global {
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
		'cli-proxy': ModuleParams<'cli-proxy'> & {
			url: string;
			tid: number;
		};
		'fractal-gen': ModuleParams<'fractal-gen'> & {};
		'playground': ModuleParams<'playground'> & {
			tid: number;
		};
	}

	export type ModuleName = keyof ModuleParamsMap;

	export type ModuleFactory<T extends ModuleParams = ModuleParams> = Func<T, Eventually<void>>;
}
