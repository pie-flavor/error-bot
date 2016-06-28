// tslint:disable-next-line:no-var-requires
const config = require( '../data/config.json' ) as {
	userAgent: string;
	baseUrl: string;
	topicId: number;
	connectTimeout: number;
	emitTimeout: number;
	cycleDelay: number;
	actionDelay: number;
};

export = config;
