declare interface Command {
	text: string;
	respond( msg: string ): void;
}
