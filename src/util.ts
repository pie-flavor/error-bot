export function escapeMarkdown( str: string ) {
	return str.replace( /\[|\]|\(|\)|\*|\>|\`|\_|\\|\@/g, s => `\\${s}` );
}
