/* eslint-disable */

import * as api from '~nodebb/api';
import { take, takeUntil, share, filter, mergeMap, concatMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import cfg from '~data/mongodb.yaml';
import { MongoClient } from 'mongodb';
import { parseCommands } from '~rx';
import { tapLog } from 'rxjs-util';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'casino';
type Params = ModuleParamsMap[ ModuleName ];

interface UserEntity {
	uid: number;
	cash: number;
}

export default async function( { moduleName, session, socket, bus, commandFilter = {} }: Params ) {
	const client = await MongoClient.connect( cfg.url, cfg.clientOptions );
	disposed.subscribe( () => {
		client.close();
	} );

	const db = client.db( moduleName );

	const coll = db.collection<UserEntity>( 'user' );

	const commands =
		socket.getEvent( 'event:new_notification' )
		.pipe(
			takeUntil( disposed ),
			parseCommands( commandFilter ),
			share()
		);

	async function getUser( uid: number ) {
		return ( await coll.findOneAndUpdate(
			{ uid: { $eq: uid } },
			{ $setOnInsert: { uid, cash: 500 } },
			{ upsert: true }
		) ).value;
	}

	commands.pipe(
		filter( e => /^!cash[-_\s]?in\b/.test( e.text ) ),
		concatMap( async ( { from: uid, pid, tid } ) => {
			await coll.findOneAndUpdate( { uid: { $eq: uid }, cash: { $lt: 500 } }, { $setOnInsert: { uid }, $set: { cash: 500 } }, { upsert: true } );
			const user = await getUser( uid );
			bus.next( { type: 'enqueue_action', action: async () => {
			 	api.posts.reply( { socket, tid, content: `Cash available: $${user.cash.toFixed( 2 )}.`, toPid: pid } );
			} } );
		} )
	).subscribe();

	type RouletteColor = 'green'|'red'|'black';
	const rouletteColors = {
		'00': 'green',
		'0': 'green',
		'1': 'red',
		'2': 'black',
		'3': 'red',
		'4': 'black',
		'5': 'red',
		'6': 'black',
		'7': 'red',
		'8': 'black',
		'9': 'red',
		'10': 'black',
		'11': 'black',
		'12': 'red',
		'13': 'black',
		'14': 'red',
		'15': 'black',
		'16': 'red',
		'17': 'black',
		'18': 'red',
		'19': 'red',
		'20': 'black',
		'21': 'red',
		'22': 'black',
		'23': 'red',
		'24': 'black',
		'25': 'red',
		'26': 'black',
		'27': 'red',
		'28': 'black',
		'29': 'black',
		'30': 'red',
		'31': 'black',
		'32': 'red',
		'33': 'black',
		'34': 'red',
		'35': 'black',
		'36': 'red'
	} as { [ key: string ]: RouletteColor };

	commands.pipe(
		filter( e => /^!roul{1,2}et{1,2}e\b/.test( e.text ) ),
		concatMap( async ( { from: uid, text, pid, tid } ) => {
			let user = await getUser( uid );
			const args = text.split( /\s+/g ).slice( 1 );
			const betAmt = parseFloat( ( args[ 0 ] || '' ).replace( /^\$/, '' ) );
			if( betAmt <= 0 || !isFinite( betAmt ) || betAmt > user.cash ) return;

			const betType = ( args.slice( 1 ).join( '' ) ).toLowerCase()
			.replace( /-|\b(?:to|thru|through)\b/gi, ':' )
			.replace( /_/gi, '' )
			.replace( /column/gi, 'col' )
			.replace( /\b1st/gi, 'first' )
			.replace( /\b2nd/gi, 'second' )
			.replace( /\b3rd/gi, 'third' );


			let payout: number;
			let winners: readonly string[];

			console.log( { betType } );

			const possibleValues = Object.keys( rouletteColors );
			const possibleNums = possibleValues.map( v => parseInt( v, 10 ) ).filter( v => v > 0 );

			switch( betType ) {
			case '00':
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
			case '10':
			case '11':
			case '12':
			case '13':
			case '14':
			case '15':
			case '16':
			case '17':
			case '18':
			case '19':
			case '20':
			case '21':
			case '22':
			case '23':
			case '24':
			case '25':
			case '26':
			case '27':
			case '28':
			case '29':
			case '30':
			case '31':
			case '32':
			case '33':
			case '34':
			case '35':
			case '36':
				winners = [ betType ];
				payout = 35;
				break;
			case 'red':
			case 'black':
				winners =
					Object.entries( rouletteColors )
					.filter( ( [ , color ] ) => color === betType )
					.map( ( [ key ] ) => key );
				payout = 1;
				break;
			case 'topline':
			case 'basket':
				winners = [ '0', '00', '1', '2', '3' ];
				payout = 6;
				break;
			case 'firstcol':
				winners =
					possibleNums
					.filter( num => ( ( num + 2 ) % 3 ) === 0 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case 'secondcol':
				winners =
					possibleNums
					.filter( num => ( ( num + 1 ) % 3 ) === 0 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case 'thirdcol':
				winners =
					possibleNums
					.filter( num => ( ( num + 0 ) % 3 ) === 0 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case '1:12':
			case 'firstdozen':
			case 'first12':
				winners =
					possibleNums
					.filter( num => num >= 1 && num <= 12 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case '13:24':
			case 'seconddozen':
			case 'second12':
				winners =
					possibleNums
					.filter( num => num >= 13 && num <= 24 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case '25:36':
			case 'thirddozen':
			case 'third12':
				winners =
					possibleNums
					.filter( num => num >= 25 && num <= 36 )
					.map( num => String( num ) );
				payout = 2;
				break;
			case '1:18':
				winners =
					possibleNums
					.filter( num => num >= 1 && num <= 18 )
					.map( num => String( num ) );
				payout = 1;
				break;
			case '19:36':
				winners =
					possibleNums
					.filter( num => num >= 19 && num <= 36 )
					.map( num => String( num ) );
				payout = 1;
				break;
			case '0:00':
			case 'green':
			case 'row':
				winners = [ '0', '00' ];
				payout = 17;
				break;
			case 'even':
				winners =
					possibleNums
					.filter( num => ( num % 2 ) === 0 )
					.map( num => String( num ) );
				payout = 1;
				break;
			case 'odd':
				winners =
					possibleNums
					.filter( num => ( num % 2 ) === 1 )
					.map( num => String( num ) );
				payout = 1;
				break;
			default: return;
			}

			console.log( { winners, payout } );

			const outcomeValue = possibleValues[ Math.floor( Math.random() * possibleValues.length ) ];
			const outcomeColor = rouletteColors[ outcomeValue ];
			const isWinner = winners.includes( outcomeValue );
			const netChange = isWinner ? payout * betAmt : -betAmt;

			console.log( { possibleValues, outcomeColor, outcomeValue, isWinner, netChange } );

			await coll.findOneAndUpdate(
				{ uid: { $eq: uid } },
				{ $inc: { cash: netChange } },
				{ upsert: true }
			);

			user = await getUser( uid );

			bus.next( { type: 'enqueue_action', action: async () => {
				api.posts.reply( { socket, tid, content: `Result: ${outcomeColor} ${outcomeValue}; You ${isWinner ? 'win' : 'lose'} $${Math.abs( netChange ).toFixed( 2 )}.  You now have $${user.cash.toFixed( 2 )}.`, toPid: pid } );
			} } );
		} )
	).subscribe();


	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
