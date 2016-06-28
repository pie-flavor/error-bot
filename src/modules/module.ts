abstract class Module {
	constructor( protected context: NodeBBContext ) {}

	public async command( command: Command ) {
		return command;
	}
}

export default Module;
