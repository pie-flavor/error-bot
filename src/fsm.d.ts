import { Fsm, FsmState, FsmTransition } from './fsm';

declare interface IFsmMessageSentEventArgs {
	message: string;
	currentState: FsmState;
}

declare interface IFsmMessageReceivedEventArgs {
	message: string;
	fsm: Fsm;
}

declare interface IFsmStateChangeArgs {
	previousState: FsmState;
	nextState: FsmState;
}

declare interface IFsmStateEnterArgs {
	previousState: FsmState;
	fsm: Fsm;
}

declare interface IFsmStateExitArgs {
	nextState: FsmState;
	fsm: Fsm;
}

declare interface IFsmTransitionArgs {
	transition: FsmTransition;
	fsm: Fsm;
}
