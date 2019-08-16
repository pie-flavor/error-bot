declare namespace NodeBB {
	export type NumberBool = 0|1;

	export type UserStatus = 'online'|'offline'|'dnd'|'away';

	export interface MessageData {
		readonly content: string;
		readonly timestamp: number;
		readonly fromuid: number;
		readonly roomId: string;
		readonly messageId: number;
		readonly fromUser: Pick<UserData, 'username'|'userslug'|'picture'|'status'|'uid'|'icon:text'|'icon:bgColor'>;
		readonly self: number;
		readonly timestampISO: string;
		readonly newSet: boolean;
		readonly cleanedContent: string;
		readonly mid: number;
	}

	interface ChatReceiveEvent {
		readonly roomId: string;
		readonly fromuid: number;
		readonly message: {
			readonly content: MessageData;
			readonly deleted: boolean;
			readonly edited: number;
			readonly timestamp: number;
			readonly timestampISO: string;
			readonly editedISO: string;
			readonly messageId: number;
			readonly fromUser: Pick<UserData, 'uid'|'banned'|'status'|'picture'|'username'|'userslug'|'icon:text'|'icon:bgColor'|'deleted'>;
			readonly self: number;
			readonly newSet: boolean;
			readonly cleanedContent: string;
			readonly mid: number;
		};
		readonly uids: readonly number[];
		readonly self: number;
	}

	type NotificationType = 'upvote'|'mention'|'new-topic'|'new-reply'|'follow'|'chat'|'group-invite'|'new-register'|'post-queue'|'new-post-flag'|'new-user-flag';
	export interface NewNotificationEvent {
		readonly bodyLong: string;
		readonly bodyShort: string;
		readonly cid: number;
		readonly datetime: number;
		readonly from: number;
		readonly importance: number;
		readonly mergeId?: string;
		readonly nid: string;
		readonly path: string;
		readonly pid: number;
		readonly tid: number;
		readonly topicTitle?: string;
		readonly type: NotificationType;
	}

	export interface MentionNotification {
		readonly type: 'mention';
		readonly nid: string;
		readonly pid: number;
		readonly tid: number;
		readonly from: number;
		readonly bodyShort: string;
		readonly importance: number;
		readonly datetimeISO: string;
		readonly user: UserData;
		readonly image: string;
		readonly read: boolean;
		readonly readClass: string;
	}

	export type Notification = MentionNotification;


	export interface PostData {
		readonly bookmarked: boolean;
		readonly content: string;
		readonly deleted: number;
		readonly deleterUid: number;
		readonly display_delete_tools: boolean;
		readonly display_edit_tools: boolean;
		readonly display_moderator_tools: boolean;
		readonly display_post_menu: boolean;
		readonly downvoted: boolean;
		readonly downvotes: number;
		readonly edited: number;
		readonly editedISO: string;
		readonly editor: unknown;
		readonly index: number;
		readonly pid: number;
		readonly replies: {
			readonly count: number;
			readonly users: readonly {}[];
			readonly hasMore: boolean;
			readonly text: string;
			readonly timestampISO: string;
		};
		readonly selfPost: boolean;
		readonly tid: number;
		readonly timestamp: number;
		readonly timestampISO: string;
		readonly uid: number;
		readonly upvoted: boolean;
		readonly upvotes: number;
		readonly user: UserData;
		readonly votes: number;
	}

	export interface GroupData {
		readonly name: string;
		readonly slug: string;
		readonly labelColor: string;
		readonly icon: string;
		readonly userTitle: string;
		readonly hidden: number;
		readonly system: number;
		readonly deleted: number;
		readonly private: number;
		readonly ownerUid: number;
		readonly createTime: number;
		readonly description: string;
		readonly memberCount: number;
		readonly userTitleEnabled: number;
		readonly disableJoinRequests: number;
		readonly nameEncoded: string;
		readonly displayName: string;
		readonly createTimeISO: string;
		readonly 'cover:thumb:url': string;
		readonly 'cover:url': string;
		readonly 'cover:position': string;
		
	}

	export interface TopicData {
		readonly tid: number;
		readonly title: string;
		readonly slug: string;
		readonly cid: number;
		readonly postcount: number;
		readonly mainPid: number;
	}

	type PageData = {
		readonly page: number;
		readonly active: boolean;
		readonly qs?: string;
	};

	export interface TopicData {
		readonly allowMultipleBadges: boolean;
		readonly bodyClass: string;
		readonly bookmark: number;
		readonly bookmarkThreshold: number;
		readonly breadcrumbs: readonly {
			readonly text: string;
			readonly url?: string;
		}[];
		readonly category: {};
		readonly cid: number;
		readonly deleted: number;
		readonly deleter: unknown;
		readonly 'downvote:disabled': number;
		readonly downvotes: number;
		readonly 'feeds:disableRSS': number;
		readonly icons: readonly {}[];
		readonly isFollowing: boolean;
		readonly isIgnoring: boolean;
		readonly isNotFollowing: boolean;
		readonly lastposttime: number;
		readonly lastposttimeISO: string;
		readonly locked: number;
		readonly loggedIn: boolean;
		readonly loggedInUser: {};
		readonly mainPid: number;
		readonly merger: unknown;
		readonly pagination: {
			readonly currentPage: number;
			readonly next: PageData;
			readonly pageCount: number;
			readonly prev: PageData;
			readonly rel: readonly {
				rel: string;
				href; string;
			}[];
		};
		readonly pinned: number;
		readonly postDeleteDuration: number;
		readonly postEditDuration: number;
		readonly postIndex: number;
		readonly postSharing: readonly {}[]
		readonly postcount: number;
		readonly posts: readonly PostData[];
		readonly privileges: {};
		readonly related: readonly {}[];
		readonly relative_path: string;
		readonly 'reputation:disabled': boolean;
		readonly rssFeedUrl: string;
		readonly scrollToMyPost: boolean;
		readonly slug: string;
		readonly tagWhitelist: readonly {}[];
		readonly tags: readonly {}[];
		readonly teaserPid: number;
		readonly template: {
			readonly name: string;
			readonly topic: boolean;
		};
		readonly thread_tools: readonly {}[];
		readonly tid: number;
		readonly timestamp: number;
		readonly timestampISO: number;
		readonly title: string;
		readonly titleRaw: string;
		readonly topicStaleDays: number;
		readonly uid: number;
		readonly unreplied: boolean;
		readonly upvotes: number;
		readonly url: string;
		readonly viewcount: number;
		readonly votes: number;
		readonly widgets: readonly { html: string; }[];
	}

	export interface UserData {
		readonly uid: number;
		readonly banned: boolean;
		readonly status: UserStatus;
		readonly picture: string;
		readonly username: string;
		readonly userslug: string;
		readonly postcount: number;
		readonly signature: string;
		readonly groupTitle: string;
		readonly lastonline: number;
		readonly reputation: number;
		readonly 'banned:expire': number;
		readonly groupTitleArray: readonly string[];
		readonly 'icon:text': 'string';
		readonly 'icon:bgColor': string;
		readonly lastonlineISO: string;
		readonly banned_until: number;
		readonly banned_until_readable: string;
		readonly selectedGroups: readonly Pick<GroupData, 'name'|'slug'|'labelColor'|'icon'|'userTitle'>[];
		readonly custom_profile_info: readonly unknown[];
		readonly editHistoryVisible: boolean;
		readonly fullname?: string;
		readonly deleted: boolean;
	}

	export interface AlertEvent {
		readonly alert_id: string;
		readonly title: string;
		readonly message: string;
		readonly type: string;
	}

	export interface BannedEvent {
		readonly until: number;
		readonly reason: string;
	}

	export interface NewPostEvent {
		readonly posts: readonly {
			readonly pid: number;
			readonly uid: number;
			readonly tid: number;
			readonly content: string;
			readonly timestamp: number;
			readonly edited?: number;
			readonly deleted: number;
			readonly ip?: string;
			readonly toPid?: string;
			readonly cid: number;
			readonly isMain: boolean;
			readonly parent: {
				readonly username: string;
			};
			readonly user: UserData;
			readonly topic: TopicData;
			readonly index: number;
			readonly votes: number;
			readonly bookmarked: boolean;
			readonly display_edit_tools: boolean;
			readonly display_delete_tools: boolean;
			readonly display_moderator_tools: boolean;
			readonly display_move_tools: boolean;
			readonly selfPost: boolean;
			readonly timestampISO: string;
			readonly categoryWatchState: number;
			readonly reputation?: number;
			readonly editor?: string;
			readonly favourited?: boolean;
		}[];
		readonly 'reputation:disabled': boolean;
		readonly 'downvote:disabled': boolean;
	}

	export type WatchState = 'follow'|'unfollow'|'ignore';

	export interface VotedEvent {
		readonly user: Pick<UserData, 'reputation'>;
		readonly fromuid: number;
		readonly post: Pick<PostData, 'pid'|'tid'|'uid'|'upvotes'|'downvotes'|'votes'>;
		readonly upvote: boolean;
		readonly downvote: boolean;
	}

	export interface UserStatusChangeEvent {
		readonly uid: number;
		readonly status: UserStatus;
	}

	export interface UnreadUpdateCountEvent {
		readonly unreadTopicCount: number;
		readonly unreadNewTopicCount: number;
		readonly unreadWatchedTopicCount: number;
		readonly unreadUnrepliedTopicCount: number;
	}

	export interface EventMap {
		'checkSession': number;
		'event:alert': AlertEvent;
		'event:banned': BannedEvent;
		'event:bookmarked': {};
		'event:chats.edit': {};
		'event:chats.markedAsRead': {};
		'event:chats.receive': ChatReceiveEvent;
		'event:livereload': {};
		'event:notifications.updateCount': number;
		'event:new_notification': NewNotificationEvent;
		'event:new_post': NewPostEvent;
		'event:nodebb.ready': {};
		'event:post_deleted': {};
		'event:post_edited': {};
		'event:post_purged': {};
		'event:post_restored': {};
		'event:setHostname': string;
		'event:topic_deleted': {};
		'event:topic_locked': {};
		'event:topic_moved': {};
		'event:topic_pinned': {};
		'event:topic_purged': {};
		'event:topic_restored': {};
		'event:topic_unlocked': {};
		'event:topic_unpinned': {};
		'event:unread.updateCount': UnreadUpdateCountEvent;
		'event:unread.updateChatCount': {};
		'event:user_status_change': UserStatusChangeEvent;
		'event:voted': VotedEvent;
	}

	export type Privilege =
		'chat'|'find'|'read'
		|'groups:chat'|'groups:find'|'groups:moderate'|'groups:read'|'groups:topics:read'
		|'topics:read';

	export type EventName = EventNameImpl<EventMap>;
	export type EventArgs = EventArgsImpl<EventMap>;
	export type EventQueueEntry<T extends EventName = EventName> = EventQueueEntryImpl<EventMap, T>;
	export type EventQueue<T extends EventName = EventName> = EventQueueImpl<EventMap, T>;
	export type EventHandler<T extends EventName = EventName> = EventHandlerImpl<EventMap, T>;
	export interface EventHandlerMap extends EventHandlerMapImpl<EventMap> {}

	export type Event<K extends EventName = EventName> = EventMap[K] & { event: K; };
}

declare type EventNameImpl<TEventMap> = keyof TEventMap;
declare type EventArgsImpl<TEventMap> = EventNameImpl<TEventMap>;
declare type EventQueueEntryImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = TEventMap[T] & { event: T };
declare type EventQueueImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = EventQueueEntryImpl<TEventMap, T>[];
declare type EventHandlerImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = ( e: TEventMap[T] ) => void;

declare interface EventHandlerMapImpl<TEventMap> {
	clear(): void;
	delete( key: EventNameImpl<TEventMap> ): boolean;
	forEach( callbackfn: ( value: EventHandlerImpl<TEventMap>, key: EventNameImpl<TEventMap>, map: this ) => void, thisArg?: any ): void;
	get<T extends EventNameImpl<TEventMap>>( key: T ): EventHandlerImpl<TEventMap, T> | undefined;
	get( key: string ): EventHandlerImpl<TEventMap> | undefined;
	has( key: EventNameImpl<TEventMap> ): boolean;
	set<T extends EventNameImpl<TEventMap>>( key: T, value: EventHandlerImpl<TEventMap, T> ): this;
	set( key: string, value: EventHandlerImpl<TEventMap, EventNameImpl<TEventMap>> ): this;
	readonly size: number;
	[Symbol.iterator](): IterableIterator<[EventNameImpl<TEventMap>, EventHandlerImpl<TEventMap>]>;
	entries(): IterableIterator<[EventNameImpl<TEventMap>, EventHandlerImpl<TEventMap>]>;
	keys(): IterableIterator<EventNameImpl<TEventMap>>;
	values(): IterableIterator<EventHandlerImpl<TEventMap>>;
}
