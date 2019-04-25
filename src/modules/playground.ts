import * as api from '~nodebb/api';
import { createCanvas } from 'canvas';

import { Decimal as DecimalImpl } from 'decimal.js';

import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { perfTest } from '~util';

const Decimal = DecimalImpl.clone().set( {
	precision: 7, rounding: 7
} );

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

type ModuleName = 'playground';
type Params = ModuleParamsMap[ ModuleName ];

const domain = {
	min: { x: new Decimal( -2 ), y: new Decimal( -1.25 ) },
	max: { x: new Decimal( .5 ), y: new Decimal( 1.25 ) }
};

const MAX_ITER = 255;

function round( num: number, amt: number = 100 ) {
	return Math.round( num * amt ) / amt;
}

function getPalette() {
	const canvas = createCanvas( MAX_ITER + 1, 1 );
	const { width, height } = canvas;
	const c2d = canvas.getContext( '2d' );
	const gradient = c2d.createLinearGradient( .5, .5, width - .5, height - .5 );
	const colorStops = MAX_ITER;
	const pctStep = 1 / ( colorStops - 1 );
	const hueShift = Math.round( Math.random() * 360 );
	const hueScale = Math.random() * 1.9 + .1;
	for( let i = 0; i < colorStops; ++i ) {
		const pct = i * pctStep;
		const color = `hsl(${round( ( ( pct * 360 ) + hueShift ) * hueScale % 360 )},80%,50%)`;
		try {
			gradient.addColorStop( pct, color );
		} catch( ex ) {
			console.error( ex, color );
		}
	}
	c2d.fillStyle = gradient;
	c2d.fillRect( 0, 0, width, height );
	const imageData = c2d.getImageData( 0, 0, width, height );
	return new Uint8ClampedArray( [ ...imageData.data ] );
}

function mandelbrot( ca: DecimalImpl, cb: DecimalImpl ) {
	let za = new Decimal( 0 ), zb = new Decimal( 0 );
	const z2 = new Decimal( 2 );
	let n: number;
	for( n = 0; n < MAX_ITER; ++n ) {
		const za2 = za.pow( z2 ).sub( zb.pow( z2 ) );
		const zb2 = z2.mul( za ).mul( zb );
		za = za2.add( ca );
		zb = zb2.add( cb );
		if( za.pow( 2 ).add( zb.pow( 2 ) ).gt( 4 ) ) break;
	}
	return n;
}

function rand( min: number|DecimalImpl, max: number|DecimalImpl = min ) {
	if( typeof max === 'number' ) max = new Decimal( max );
	const range = max.sub( min );
	return Decimal.random().times( range ).plus( min );
}

export default async function( { moduleName, session, socket, bus, tid }: Params ) {
	bus.next( { type: 'enqueue_action', action: async () => {
		const width = 600, height = 600;
		const canvas = createCanvas( width, height );
		const c2d = canvas.getContext( '2d', { pixelFormat: 'A8' } );
		const imageData = c2d.createImageData( width, height );

		function putPixel( x: number, y: number, paletteIndex: number ) {
			const offset = ( y * width + x );
			imageData.data[ offset ] = paletteIndex;
		}

		const d1 = new Decimal( 1 );
		const zoomLevel = rand( 1, 3 );
		const zoomFactor = d1.div( zoomLevel );

		const windowOffset = {
			x: zoomLevel.mul( rand( -.5, .5 ).mul( 0.25 ) ),
			y: zoomLevel.mul( rand( -.5, .5 ).mul( 0.25 ) )
		};

		const window = {
			min: { x: domain.min.x.mul( zoomFactor ).add( windowOffset.x ), y: domain.min.y.mul( zoomFactor ).add( windowOffset.y ) },
			max: { x: domain.max.x.mul( zoomFactor ).add( windowOffset.x ), y: domain.max.y.mul( zoomFactor ).add( windowOffset.y ) }
		};
		const windowSize = {
			x: window.max.x.sub( window.min.x ),
			y: window.max.y.sub( window.min.y )
		};

		// const theta = Math.random() * 2 * Math.PI;
		// const cs = Math.cos( theta );
		// const ss = Math.sin( theta );

		perfTest( 'mandelbrot', () => {
			for( let x = 0; x < width; ++x ) {
				for( let y = 0; y < height; ++y ) {
					const cartX = new Decimal( x ).div( width );
					const cartY = d1.sub( new Decimal( y ).div( height ) );

					const realPart = cartX.mul( windowSize.x ).add( window.min.x );
					const imaginaryPart = cartY.mul( windowSize.y ).add( window.min.y );

					const colorIndex = mandelbrot( realPart, imaginaryPart );
					putPixel( x, y, colorIndex );
				}
			}
		} )();

		c2d.putImageData( imageData, 0, 0 );

		const contentType = 'image/png';
		const buffer = canvas.toBuffer( contentType, {
			compressionLevel: 9,
			palette: getPalette()
		} );

		const filename = 'mandelbrot.png';
		bus.next( { type: 'enqueue_action', action: async () => {
			const url = await api.posts.upload( { session, filename, buffer, contentType } );
			const content = `![Mandelbrot](${url})`;
			bus.next( { type: 'enqueue_action', action: async () => {
				await api.posts.reply( { socket, tid, content } );
			} } );
		} } );
	} } );


	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
