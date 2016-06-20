import { EventEmitter } from 'events';

export interface IFsmMessageSentEventArgs {
	message: string;
	currentState: FsmState;
}

export interface IFsmMessageReceivedEventArgs {
	message: string;
	fsm: Fsm;
}

export interface IFsmStateChangeArgs {
	previousState: FsmState;
	nextState: FsmState;
}

export interface IFsmStateEnterArgs {
	previousState: FsmState;
	fsm: Fsm;
}

export interface IFsmStateExitArgs {
	nextState: FsmState;
	fsm: Fsm;
}

export class Fsm extends EventEmitter {
	public createState( name: string ) {
		const { stateMap } = this;
		if( stateMap.has( name ) ) {
			throw new Error( `State "${name}" already exists` );
		}
		const state = new FsmState( name );
		stateMap.set( name, state );
		return state;
	}

	public getState( name: string ) {
		const { stateMap } = this,
			state = stateMap.get( name );
		if( !state ) {
			throw new Error( `State "${name}" does not exist` );
		}
		return state;
	}

	public pushState( nextState: FsmState|string ) {
		const { stateStack, currentState: previousState } = this;
		if( !nextState ) {
			throw new Error( 'pushState called with no nextState' );
		}
		if( typeof nextState === 'string' ) {
			nextState = this.getState( nextState );
		}
		this.onStateChange( { previousState, nextState } );
		stateStack.push( nextState );
	}

	public popState() {
		const { stateStack, currentState: previousState } = this,
			nextState = stateStack.slice( -2, -1 )[ 0 ] || null;
		if( !previousState ) {
			throw new Error( 'popState called with empty stateStack' );
		}
		this.onStateChange( { previousState, nextState } );
		return stateStack.pop();
	}

	public replaceState( nextState: FsmState|string ) {
		const { stateStack, currentState: previousState } = this;
		if( !nextState ) {
			throw new Error( 'replaceState called with no nextState' );
		}
		if( typeof nextState === 'string' ) {
			nextState = this.getState( nextState );
		}
		this.onStateChange( { previousState, nextState } );
		stateStack.pop();
		stateStack.push( nextState );
		return previousState;
	}

	private onStateChange( { previousState, nextState }: IFsmStateChangeArgs ) {
		this.emit( 'stateChange', { previousState, nextState } );
		if( previousState ) {
			previousState.emit( 'stateExit', { nextState, fsm: this } );
		}
		if( nextState ) {
			nextState.emit( 'stateEnter', { previousState, fsm: this } );
		}
	}

	public get currentState() {
		const { stateStack } = this,
			currentState = stateStack.slice( -1 )[ 0 ] || null;
		return currentState || null;
	}

	public sendMessage( message: string ) {
		const { currentState } = this;
		this.emit( 'messageSent', { message, currentState } );
		if( currentState ) {
			currentState.emit( 'messageReceived', { message, fsm: this } );
		}
	}

	private stateMap = new Map<string, FsmState>();
	private stateStack = [] as FsmState[];
}

export class FsmState extends EventEmitter {
	public constructor( public name: string ) {
		super();
	}

	public toString() {
		const { name } = this;
		return name;
	}
}
