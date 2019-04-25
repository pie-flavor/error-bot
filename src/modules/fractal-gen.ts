import * as api from '~nodebb/api';

import { parseCommands, tapLog, bufferDebounceTime, windowDebounceTime, rateLimit } from '~rx';

import { createCanvas } from 'canvas';

import Complex from 'complex.js';
import { takeUntil, take, groupBy, mergeMap, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

const disposed = new Subject<true>();
if( module.hot ) {
	module.hot.addDisposeHandler( () => {
		disposed.next( true );
		disposed.complete();
	} );
} else {
	disposed.complete();
}

const domain = {
	min: { x: -2, y: -1.25 },
	max: { x: .5, y: 1.25 }
};

type ModuleName = 'fractal-gen';
type Params = ModuleParamsMap[ ModuleName ];

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

function mandelbrot( c: Complex ) {
	let z = new Complex( 0, 0 );
	let n: number;
	for( n = 0; n < MAX_ITER; ++n ) {
		z = z.pow( 2 ).add( c );
		if( z.abs() > 2 ) break;
	}
	return n;
}

export default async function( {
	moduleName,
	socket,
	session,
	bus
}: Params ) {
	socket.getEvent( 'event:new_notification' )
	.pipe(
		takeUntil( disposed ),
		parseCommands( { text: /^!mandelbrot\b/i } ),
		rateLimit( 10 )
	).subscribe( ( {
		cid,
		tid,
		pid
	} ) => {
		bus.next( { type: 'enqueue_action', action: async () => {
			const width = 600, height = 600;
			const canvas = createCanvas( width, height );
			const c2d = canvas.getContext( '2d', { pixelFormat: 'A8' } );
			const imageData = c2d.createImageData( width, height );

			function putPixel( x: number, y: number, paletteIndex: number ) {
				const offset = ( y * width + x );
				imageData.data[ offset ] = paletteIndex;
			}

			const zoomLevel = 1 + Math.random() * 1;
			const zoomFactor = 1 / zoomLevel;

			const offsetMax = 0.75;
			const windowOffset = { x: ( Math.random() - .5 ) * offsetMax * zoomLevel, y: ( Math.random() - .5 ) * offsetMax * zoomLevel };

			const window = {
				min: { x: domain.min.x * zoomFactor + windowOffset.x, y: domain.min.y * zoomFactor + windowOffset.y },
				max: { x: domain.max.x * zoomFactor + windowOffset.x, y: domain.max.y * zoomFactor + windowOffset.y }
			};
			const windowSize = {
				x: window.max.x - window.min.x,
				y: window.max.y - window.min.y
			};

			for( let x = 0; x < width; ++x ) {
				for( let y = 0; y < height; ++y ) {
					const cartX = x / width;
					const cartY = 1 - ( y / height );

					const realPart = window.min.x + ( cartX * windowSize.x );
					const imaginaryPart = window.min.y + ( cartY * windowSize.y );

					const colorIndex = mandelbrot( new Complex( realPart, imaginaryPart ) );
					putPixel( x, y, colorIndex );
				}
			}

			c2d.putImageData( imageData, 0, 0 );

			const contentType = 'image/png';
			const buffer = canvas.toBuffer( contentType, {
				compressionLevel: 9,
				palette: getPalette()
			} );

			const filename = 'mandelbrot.png';
			bus.next( { type: 'enqueue_action', action: async () => {
				const url = await api.posts.upload( { session, filename, buffer, contentType, cid } );
				const content = `![Mandelbrot](${url})`;
				bus.next( { type: 'enqueue_action', action: async () => {
					await api.posts.reply( { socket, tid, content, toPid: pid } );
				} } );
			} } );
		} } );
	} );

	disposed.pipe( take( 1 ) )
	.subscribe( () => {
		console.log( `${moduleName} unloaded` );
	} );
	console.log( `${moduleName} loaded` );
}
