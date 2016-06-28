import Module from './module';

export default class Echo extends Module {
	public async command( command: Command ) {
		command.respond( command.text );
		return null;
	}
}
