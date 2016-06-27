import { EventEmitter } from 'events';

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
		this.onBeforeStateChange( { previousState, nextState } );
		stateStack.push( nextState );
		this.onAfterStateChange( { previousState, nextState } );
	}

	public popState() {
		const { stateStack, currentState: previousState } = this,
			nextState = stateStack.slice( -2, -1 )[ 0 ] || null;
		if( !previousState ) {
			throw new Error( 'popState called with empty stateStack' );
		}
		this.onBeforeStateChange( { previousState, nextState } );
		stateStack.pop();
		this.onAfterStateChange( { previousState, nextState } );
		return previousState;
	}

	public replaceState( nextState: FsmState|string ) {
		const { stateStack, currentState: previousState } = this;
		if( !nextState ) {
			throw new Error( 'replaceState called with no nextState' );
		}
		if( typeof nextState === 'string' ) {
			nextState = this.getState( nextState );
		}
		this.onBeforeStateChange( { previousState, nextState } );
		stateStack.pop();
		stateStack.push( nextState );
		this.onAfterStateChange( { previousState, nextState } );
		return previousState;
	}

	private onBeforeStateChange( { previousState, nextState }: FsmStateChangeArgs ) {
		if( previousState ) {
			previousState.emit( 'stateExit', { nextState, fsm: this } );
		}
	}

	private onAfterStateChange( { previousState, nextState }: FsmStateChangeArgs ) {
		if( nextState ) {
			nextState.emit( 'stateEnter', { previousState, fsm: this } );
		}
		this.emit( 'stateChange', { previousState, nextState } );
	}


	public get currentState() {
		const { stateStack } = this,
			currentState = stateStack.slice( -1 )[ 0 ] || null;
		return currentState || null;
	}

	public sendMessage( message: string ) {
		const { currentState } = this;
		let transition;
		if( currentState ) {
			currentState.emit( 'messageReceived', { message, fsm: this } );
			transition = currentState.transitions.get( message );
		}
		this.emit( 'messageSent', { message, currentState } );
		if( !transition ) {
			transition = this.transitions.get( message );
		}
		if( transition ) {
			transition.transition( this );
		}
	}

	private stateMap = new Map<string, FsmState>();
	private stateStack = [] as FsmState[];
	public transitions = new FsmTransitionMap;
}

export class FsmState extends EventEmitter {
	public constructor( public name: string ) {
		super();
	}

	public toString() {
		const { name } = this;
		return name;
	}

	public transitions = new FsmTransitionMap;
}

export class FsmTransitionMap extends Map<string, FsmTransition> {}

export abstract class FsmTransition {
	public abstract transition( fsm: Fsm );
}

export class FsmReplaceTransition extends FsmTransition {
	public constructor( public state: FsmState|string ) {
		super();
	}

	public transition( fsm: Fsm ) {
		fsm.replaceState( this.state );
	}

	public toString() {
		return `replaceState:${this.state.toString()}`;
	}
}

export class FsmPushTransition extends FsmTransition {
	public constructor( public state: FsmState|string ) {
		super();
	}

	public transition( fsm: Fsm ) {
		fsm.pushState( this.state );
	}

	public toString() {
		return `pushState:${this.state.toString()}`;
	}
}

export class FsmPopTransition extends FsmTransition {
	public transition( fsm: Fsm ) {
		fsm.popState();
	}

	public toString() {
		return 'popState';
	}
}

export class FsmNullTransition extends FsmTransition {
	public transition( fsm: Fsm ) {
		// do nothing
	}

	public toString() {
		return 'null';
	}
}
