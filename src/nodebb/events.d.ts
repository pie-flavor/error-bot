import { Subject } from 'rxjs';

declare global {
	namespace NodeBB {
		interface NewPostEvent {
			readonly posts: readonly {
				readonly pid: number;
				readonly uid: number;
				readonly tid: number;
				readonly content: string;
				readonly timestamp: number;
				readonly reputation: number;
				readonly editor: string;
				readonly edited: number;
				readonly deleted: number;
				readonly ip?: string;
				readonly cid: number;
				readonly user: {
					readonly username: string;
					readonly userslug: string;
					readonly lastonline: number;
					readonly picture: string;
					readonly fullname: string;
					readonly signature: string;
					readonly reputation: number;
					readonly postcount: number;
					readonly banned: boolean;
					readonly status: string;
					readonly uid: number;
					readonly groupTitle: string;
					readonly 'icon:text': string;
					readonly 'icon:bgColor': string;
					readonly banned_until: number;
					readonly banned_until_readable: string;
					readonly selectedGroup: {
						readonly name: string;
						readonly slug: string;
						readonly labelColor: string;
						readonly icon: string;
						readonly userTitle: string;
					};
					readonly custom_profile_info: readonly unknown[];
				};
				readonly topic: {
					readonly tid: number;
					readonly title: string;
					readonly slug: string;
					readonly cid: number;
					readonly postcount: number;
					readonly mainPid: number;
				};
				readonly index: number;
				readonly favourited: boolean;
				readonly votes: number;
				readonly display_moderator_tools: boolean;
				readonly display_move_tools: boolean;
				readonly selfPost: boolean;
				readonly timestampISO: string;
			}[];
			readonly 'reputation:disabled': boolean;
			readonly 'downvote:disabled': boolean;
		}
		
		interface ChatReceiveEvent {
			readonly roomId: string;
			readonly fromUid: number;
			readonly message: {
				readonly content: string;
				readonly timestamp: number;
				readonly fromuid: number;
				readonly roomId: string;
				readonly messageId: number;
				readonly fromUser: {
					readonly username: string;
					readonly userslug: string;
					readonly picture: string;
					readonly status: string;
					readonly uid: number;
					readonly 'icon:text': string;
					readonly 'icon:bgColor': string;
				};
				readonly self: number;
				readonly timestampISO: string;
				readonly newSet: boolean;
				readonly cleanedContent: string;
				readonly mid: number;
			};
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

		export interface EventMap {
			'event:bookmarked': {};
			'event:chats.edit': {};
			'event:chats.markedAsRead': {};
			'event:chats.receive': ChatReceiveEvent;
			'event:new_notification': NewNotificationEvent;
			'event:new_post': NewPostEvent;
			'event:post_deleted': {};
			'event:post_edited': {};
			'event:post_purged': {};
			'event:post_restored': {};
			'event:topic_deleted': {};
			'event:topic_locked': {};
			'event:topic_moved': {};
			'event:topic_pinned': {};
			'event:topic_purged': {};
			'event:topic_restored': {};
			'event:topic_unlocked': {};
			'event:topic_unpinned': {};
			'event:user_status_change': {};
		}

		export type EventName = EventNameImpl<EventMap>;
		export type EventArgs = EventArgsImpl<EventMap>;
		export type EventQueueEntry<T extends EventName = EventName> = EventQueueEntryImpl<EventMap, T>;
		export type EventQueue<T extends EventName = EventName> = EventQueueImpl<EventMap, T>;
		export type EventHandler<T extends EventName = EventName> = EventHandlerImpl<EventMap, T>;
		export interface EventHandlerMap extends EventHandlerMapImpl<EventMap> {}

		export type Event<K extends EventName = EventName> = EventMap[K] & { event: K; };
	}

	type EventNameImpl<TEventMap> = keyof TEventMap;
	type EventArgsImpl<TEventMap> = EventNameImpl<TEventMap>;
	type EventQueueEntryImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = TEventMap[T] & { event: T };
	type EventQueueImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = EventQueueEntryImpl<TEventMap, T>[];
	type EventHandlerImpl<TEventMap, T extends EventNameImpl<TEventMap> = EventNameImpl<TEventMap>> = ( e: TEventMap[T] ) => void;

	interface EventHandlerMapImpl<TEventMap> {
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
}
