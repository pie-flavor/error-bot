import Echo from './echo';

export default function( context: NodeBBContext ) {
	return [ new Echo( context ) ];
}
