const { describe, before, beforeEach, after, afterEach, it } = require( 'mocha' ),
	chai = require( 'chai' ),
	{ expect } = chai,
	{ spy } = require( 'sinon' ),
	{ Fsm, FsmState } = require( '../out/fsm' );

chai.use( require( 'sinon-chai' ) );

describe( 'Fsm', () => {
	let fsm,
		stateChange,
		messageSent;

	beforeEach( () => {
		fsm = new Fsm;
		fsm.on( 'stateChange', stateChange = spy() );
		fsm.on( 'messageSent', messageSent = spy() );
	} );

	describe( 'createState', () => {
		it( 'returns a new FsmState object', () => {
			expect( fsm.createState( 'foo' ) ).to.be.instanceof( FsmState );
		} );

		it( 'sets the name of the new FsmState object', () => {
			expect( fsm.createState( 'foo' ).name ).to.equal( 'foo' );
		} );

		it( 'throws an Error if a state already exists with the same name', () => {
			fsm.createState( 'foo' );
			expect( () => { fsm.createState( 'foo' ); } ).to.throw( Error );
		} );

		it( 'does not change the current state', () => {
			expect( fsm.currentState ).to.be.null;
			expect( stateChange ).not.to.have.been.called;
		} );
	} );

	describe( 'getState', () => {
		it( 'returns the FsmState object with a matching name', () => {
			const foo = fsm.createState( 'foo' ),
				bar = fsm.createState( 'bar' );
			expect( fsm.getState( 'foo' ) ).to.equal( foo );
			expect( fsm.getState( 'bar' ) ).to.equal( bar );
		} );

		it( 'throws an Error if no state with a matching name exists', () => {
			expect( () => { fsm.getState( 'foo' ); } ).to.throw( Error );
		} );

		it( 'does not change the current state', () => {
			expect( fsm.currentState ).to.be.null;
			expect( stateChange ).not.to.have.been.called;
		} );
	} );

	describe( 'pushState', () => {
		let foo,
			bar,
			fooStateEnter,
			fooStateExit,
			barStateEnter,
			barStateExit;
		beforeEach( () => {
			foo = fsm.createState( 'foo' );
			bar = fsm.createState( 'bar' );
			foo.on( 'stateEnter', fooStateEnter = spy() );
			foo.on( 'stateExit', fooStateExit = spy() );
			bar.on( 'stateEnter', barStateEnter = spy() );
			bar.on( 'stateExit', barStateExit = spy() );
		} );

		it( 'sets the currentState when an FsmState parameter is passed', () => {
			fsm.pushState( foo );
			expect( fsm.currentState ).to.equal( foo );
		} );

		it( 'sets the currentState when a string parameter is passed', () => {
			fsm.pushState( 'foo' );
			expect( fsm.currentState ).to.equal( foo );
		} );

		it( 'throws an Error if called with no state', () => {
			expect( () => { fsm.pushState( null ); } ).to.throw( Error );
			expect( () => { fsm.pushState( undefined ); } ).to.throw( Error );
		} );

		it( 'throws an Error if no state with a matching name exists', () => {
			expect( () => { fsm.pushState( 'baz' ); } ).to.throw( Error );
		} );

		it( 'fires the stateChange event', () => {
			fsm.pushState( foo );
			expect( stateChange ).to.have.been.calledOnce.calledWith( { previousState: null, nextState: foo } );
		} );

		it( 'fires the stateEnter event', () => {
			fsm.pushState( foo );
			expect( fooStateEnter ).to.have.been.calledOnce.calledWith( { previousState: null, fsm } );
			expect( barStateEnter ).not.to.have.been.called;
		} );

		it( 'fires the stateExit event', () => {
			fsm.pushState( foo );
			fsm.pushState( bar );
			expect( fooStateExit ).to.have.been.calledOnce.calledWith( { nextState: bar, fsm } );
			expect( barStateExit ).not.to.have.been.called;
		} );
	} );

	describe( 'popState', () => {
		let foo,
			bar,
			fooStateEnter,
			fooStateExit,
			barStateEnter,
			barStateExit;
		beforeEach( () => {
			foo = fsm.createState( 'foo' );
			bar = fsm.createState( 'bar' );
			foo.on( 'stateEnter', fooStateEnter = spy() );
			foo.on( 'stateExit', fooStateExit = spy() );
			bar.on( 'stateEnter', barStateEnter = spy() );
			bar.on( 'stateExit', barStateExit = spy() );
		} );

		it( 'removes a state from the stateStack', () => {
			fsm.pushState( foo );
			fsm.popState();
			expect( fsm.currentState ).to.be.null;
			fsm.pushState( foo );
			fsm.pushState( bar );
			fsm.popState();
			expect( fsm.currentState ).to.equal( foo );
		} );

		it( 'returns the state removed from the stateStack', () => {
			fsm.pushState( foo );
			fsm.pushState( bar );
			expect( fsm.popState() ).to.equal( bar );
			expect( fsm.popState() ).to.equal( foo );
		} );

		it( 'throws an Error if the stateStack is empty', () => {
			expect( () => { fsm.popState(); } ).to.throw( Error );
		} );

		it( 'fires the stateChange event', () => {
			fsm.pushState( foo );
			stateChange.reset();
			fsm.popState();
			expect( stateChange ).to.have.been.calledOnce.calledWith( { previousState: foo, nextState: null } );
		} );

		it( 'fires the stateEnter event', () => {
			fsm.pushState( foo );
			fsm.pushState( bar );
			fooStateEnter.reset();
			barStateEnter.reset();
			fsm.popState();
			expect( fooStateEnter ).to.have.been.calledOnce.calledWith( { previousState: bar, fsm } );
			expect( barStateEnter ).not.to.have.been.called;
		} );

		it( 'fires the stateExit event', () => {
			fsm.pushState( foo );
			fsm.pushState( bar );
			fooStateExit.reset();
			barStateExit.reset();
			fsm.popState();
			expect( fooStateExit ).not.to.have.been.called;
			expect( barStateExit ).to.have.been.calledOnce.calledWith( { nextState: foo, fsm } );
			fooStateExit.reset();
			barStateExit.reset();
			fsm.popState();
			expect( fooStateExit ).to.have.been.calledOnce.calledWith( { nextState: null, fsm } );
			expect( barStateExit ).not.to.have.been.called;
		} );
	} );

	describe( 'replaceState', () => {
		let foo,
			bar,
			fooStateEnter,
			fooStateExit,
			barStateEnter,
			barStateExit;
		beforeEach( () => {
			foo = fsm.createState( 'foo' );
			bar = fsm.createState( 'bar' );
			foo.on( 'stateEnter', fooStateEnter = spy() );
			foo.on( 'stateExit', fooStateExit = spy() );
			bar.on( 'stateEnter', barStateEnter = spy() );
			bar.on( 'stateExit', barStateExit = spy() );
		} );

		it( 'replaces the currentState when an FsmState parameter is passed', () => {
			fsm.replaceState( foo );
			expect( fsm.currentState ).to.equal( foo );
			fsm.replaceState( bar );
			expect( fsm.currentState ).to.equal( bar );
			fsm.popState();
			expect( fsm.currentState ).to.be.null;
		} );

		it( 'replaces the currentState when a string parameter is passed', () => {
			fsm.replaceState( 'foo' );
			expect( fsm.currentState ).to.equal( foo );
			fsm.replaceState( 'bar' );
			expect( fsm.currentState ).to.equal( bar );
			fsm.popState();
			expect( fsm.currentState ).to.be.null;
		} );

		it( 'throws an Error if called with no state', () => {
			expect( () => { fsm.replaceState( null ); } ).to.throw( Error );
			expect( () => { fsm.replaceState( undefined ); } ).to.throw( Error );
		} );

		it( 'throws an Error if no state with a matching name exists', () => {
			expect( () => { fsm.replaceState( 'baz' ); } ).to.throw( Error );
		} );

		it( 'does not throw an Error if the stateStack is empty', () => {
			expect( () => { fsm.replaceState( foo ); } ).not.to.throw( Error );
		} );

		it( 'fires the stateChange event', () => {
			fsm.pushState( foo );
			stateChange.reset();
			fsm.replaceState( bar );
			expect( stateChange ).to.have.been.calledOnce.calledWith( { previousState: foo, nextState: bar } );
		} );

		it( 'fires the stateEnter event', () => {
			fsm.pushState( foo );
			fooStateEnter.reset();
			barStateEnter.reset();
			fsm.replaceState( bar );
			expect( fooStateEnter ).not.to.have.been.called;
			expect( barStateEnter ).to.have.been.calledOnce.calledWith( { previousState: foo, fsm } );
		} );

		it( 'fires the stateExit event', () => {
			fsm.pushState( foo );
			fooStateExit.reset();
			fsm.replaceState( bar );
			expect( fooStateExit ).to.have.been.calledOnce.calledWith( { nextState: bar, fsm } );
			expect( barStateExit ).not.to.have.been.called;
		} );
	} );

	describe( 'currentState', () => {
		it( 'defaults to null', () => {
			expect( fsm.currentState ).to.be.null;
		} );

		it( 'has no setter', () => {
			expect( Object.getPrototypeOf( fsm ) ).ownPropertyDescriptor( 'currentState' ).to.have.property( 'set', undefined );
		} );
	} );

	describe( 'sendMessage', () => {
		let foo,
			bar,
			fooMessageReceived,
			barMessageReceived;
		beforeEach( () => {
			foo = fsm.createState( 'foo' );
			bar = fsm.createState( 'bar' );
			foo.on( 'messageReceived', fooMessageReceived = spy() );
			bar.on( 'messageReceived', barMessageReceived = spy() );
			fsm.replaceState( 'foo' );
		} );

		it( 'fires the messageSent event', () => {
			fsm.sendMessage( 'foo' );
			expect( messageSent ).to.have.been.calledOnce.calledWith( { message: 'foo', currentState: foo } );
		} );

		it( 'fires the messageReceived event', () => {
			fsm.sendMessage( 'foo' );
			expect( fooMessageReceived ).to.have.been.calledOnce.calledWith( { message: 'foo', fsm } );
			expect( barMessageReceived ).not.to.have.been.called;
		} );
	} );
} );

describe( 'FsmState', () => {
	let fsm,
		fsmState;
	beforeEach( () => {
		fsm = new Fsm;
		fsmState = fsm.createState( 'foo' );
	} );

	describe( 'toString', () => {
		it( 'returns the name of the FsmState', () => {
			expect( fsmState.toString() ).to.equal( fsmState.name );
		} );
	} );
} );
