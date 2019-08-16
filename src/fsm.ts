import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, pairwise, map } from 'rxjs/operators';

export interface FsmState<TState extends string, TTransition extends string> {
	readonly transitions: {
		readonly [ key in TTransition ]?: TState|void;
	};
	readonly final?: false|void;
}

export interface FsmFinalState {
	readonly final: true;
}

export interface FsmDefinition<TState extends string, TTransition extends string> {
	readonly initial?: TState|void;
	readonly states: {
		readonly [ key in TState ]: FsmState<TState, TTransition>|FsmFinalState;
	};
	readonly transitions?: {
		readonly [ key in TTransition ]?: TState|null;
	};
}

export interface FsmAction<TState extends string> {
	readonly leave: TState|null;
	readonly enter: TState|null;
}

function toMap( ...objs: readonly object[] ) {
	return new Map<keyof any, any>( [ ...objs ].reverse().flatMap( o => Object.entries( o ) ) );
}

export class Fsm<TState extends string, TTransition extends string> {
	public constructor( private readonly root: FsmDefinition<TState, TTransition> ) {
		this.currentState.next( null );
		this.currentState.next( root.initial || null );
	}

	private readonly currentState = new BehaviorSubject<TState>( null );
	private readonly _transitions = new Subject<TTransition>();
	public readonly transitions = this._transitions.pipe();

	public transition( transition: TTransition ) {
		const { root } = this;
		const currentState = this.currentState.value;

		const state = ( currentState == null ) ? null : root.states[ currentState ] as FsmState<TState, TTransition>;
		if( state && state.final ) return;

		this._transitions.next( transition );
		const nextStateName = toMap( state && state.transitions || {}, root.transitions || {} ).get( transition );
		if( nextStateName !== undefined ) {
			this.currentState.next( nextStateName );
			const nextState = root.states[ nextStateName ];
			if( nextState && nextState.final ) {
				this.complete();
			}
		}
	}

	public readonly actions: Observable<FsmAction<TState>> =
		this.currentState.pipe(
			distinctUntilChanged(),
			pairwise(),
			map( ( [ leave, enter ] ) => ( { leave, enter } ) )
		);

	public complete() {
		this._transitions.complete();
		this.currentState.complete();
	}
}
