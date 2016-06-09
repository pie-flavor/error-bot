import * as rp from 'request-promise';

export interface INodeBBConfig {
	environment: string;
	relative_path: string;
	version: string;
	siteTitle: string;
	browserTitle: string;
	titleLayout: string;
	showSiteTitle: boolean;
	minimumTitleLength: number;
	maximumTitleLength: number;
	minimumPostLength: number;
	maximumPostLength: number;
	minimumTagsPerTopic: number;
	maximumTagsPerTopic: number;
	hasImageUploadPlugin: boolean;
	useOutgoingLinksPage: boolean;
	allowGuestSearching: boolean;
	allowGuestUserSearching: boolean;
	allowGuestHandles: boolean;
	allowFileUploads: boolean;
	allowTopicsThumbnail: boolean;
	usePagination: boolean;
	disableChat: boolean;
	socketioTransports: string[];
	websocketAddress: string;
	maxReconnectionAttempts: number;
	reconnectionDelay: number;
	topicsPerPage: number;
	postsPerPage: number;
	maximumFileSize: number;
	'theme:id': string;
	'theme:src': string;
	defaultLang: string;
	loggedIn: boolean;
	'cache-buster': string;
	requireEmailConfirmation: boolean;
	topicPostSort: string;
	categoryTopicSort: string;
	csrf_token: string;
	searchEnabled: boolean;
	bootswatchSkin: boolean;
	'composer-default': {};
	markdown: {
		highlight: number;
		theme: string;
	};
}

export default class NodeBBApi {
	public constructor( public baseUrl: string ) {}

	private _csrf: string;
	private jar = rp.jar();

	public async getConfig() {
		const { baseUrl, jar } = this,
			uri = `${baseUrl}/api/config`,
			method = 'GET',
			json = true,
			config: INodeBBConfig = await rp( { uri, method, json, jar } );
		this._csrf = config.csrf_token;
		return config;
	}

	private async ensureCsrf() {
		if( this._csrf ) { return; }
		await this.getConfig();
	}

	public async logOut() {
		await this.ensureCsrf();
		const { baseUrl, _csrf, jar } = this,
			uri = `${baseUrl}/logout`,
			method = 'POST',
			body = { _csrf },
			json = true;
		return rp( { uri, method, body, json, jar } );
	}

	public async logIn( username: string, password: string ) {
		await this.ensureCsrf();
		const { baseUrl, _csrf, jar } = this,
			uri = `${baseUrl}/login`,
			method = 'POST',
			body = { username, password, _csrf },
			json = true;
		return rp( { uri, method, body, json, jar } );
	}
}
