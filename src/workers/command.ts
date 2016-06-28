import commandQueue from '../queues/command';
// import modules from '../modules/';

export default async function() {
	let command = commandQueue.shift();
	/*
	for( let module of modules ) {
		if( !command ) {
			break;
		}
		command = await module( command );
	}
	*/
	if( command ) {
		command.respond( `Unable to process command: ${command.text}` );
	}
};
