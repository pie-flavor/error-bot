import { Fsm, FsmState, FsmTransition } from './fsm';

declare global {
	export interface FsmMessageSentEventArgs {
		message: string;
		currentState: FsmState;
	}

	export interface FsmMessageReceivedEventArgs {
		message: string;
		fsm: Fsm;
	}

	export interface FsmStateChangeArgs {
		previousState: FsmState;
		nextState: FsmState;
	}

	export interface FsmStateEnterArgs {
		previousState: FsmState;
		fsm: Fsm;
	}

	export interface FsmStateExitArgs {
		nextState: FsmState;
		fsm: Fsm;
	}

	export interface FsmTransitionArgs {
		transition: FsmTransition;
		fsm: Fsm;
	}
}
