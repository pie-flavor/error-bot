declare interface NodeBBConfig {
	acpLang: string;
	allowFileUploads: boolean;
	allowGuestHandles: boolean;
	allowTopicsThumbnail: boolean;
	bootswatchSkin: boolean;
	browserTitle: string;
	'cache-buster': string;
	categoryTopicSort: string;
	'composer-default': {};
	cookies: {
		enabled: boolean;
		message: string;
		dismiss: string;
		link: string;
	};
	csrf_token: string|false;
	defaultLang: string;
	disableChat: boolean;
	disableChatMessageEditing: boolean;
	enablePostHistory: boolean;
	enableQuickReply: boolean;
	hideCategoryLastPost: boolean;
	hideSubCategories: boolean;
	loggedIn: boolean;
	markdown: {
		highlight: number;
		highlightLinesLanguageList: string[];
		theme: string;
	};
	maximumFileSize: number;
	maximumPostLength: number;
	maximumTagsPerTopic: number;
	maximumTitleLength: number;
	maxReconnectionAttempts: number;
	minimumPostLength: number;
	minimumTagLength: number;
	minimumTagsPerTopic: number;
	minimumTitleLength: number;
	notificationAlertTimeout: number;
	openOutgoingLinksInNewTab: boolean;
	postsPerPage: number;
	reconnectionDelay: number;
	relative_path: string;
	requireEmailConfirmation: boolean;
	searchEnabled: boolean;
	showSiteTitle: boolean;
	siteTitle: string;
	socketioOrigins: string;
	socketioTransports: string[];
	'sso-google': { style: string; };
	'theme:id': string;
	'theme:src': string;
	timeagoCodes: string[];
	timeagoCutoff: number;
	titleLayout: string;
	topicPostSort: string;
	topicSearchEnabled: boolean;
	topicsPerPage: number;
	uid: number;
	upload_url: string;
	useOutgoingLinksPage: boolean;
	usePagination: boolean;
	userLang: string;
	websocketAddress: string;
}
