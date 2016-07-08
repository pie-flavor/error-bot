import * as api from '../nodebb/api';

interface NewPostArgs {
	posts: {
		pid: number;
		uid: number;
		tid: number;
		content: string;
		timestamp: number;
		reputation: number;
		editor: string;
		edited: number;
		deleted: number;
		ip?: string;
		cid: number;
		user: {
			username: string;
			userslug: string;
			lastonline: number;
			picture: string;
			fullname: string;
			signature: string;
			reputation: number;
			postcount: number;
			banned: boolean;
			status: string;
			uid: number;
			groupTitle: string;
			'icon:text': string;
			'icon:bgColor': string;
			banned_until: number;
			banned_until_readable: string;
			selectedGroup: {
				name: string;
				slug: string;
				labelColor: string;
				icon: string;
				userTitle: string;
			};
			custom_profile_info: Array<void>;
		};
		topic: {
			tid: number;
			title: string;
			slug: string;
			cid: number;
			postcount: number;
			mainPid: number;
		};
		index: number;
		favourited: boolean;
		votes: number;
		display_moderator_tools: boolean;
		display_move_tools: boolean;
		selfPost: boolean;
		timestampISO: string;
	}[];
	'reputation:disabled': boolean;
	'downvote:disabled': boolean;
}

interface ChatReceiveArgs {
	roomId: string;
	fromUid: number;
	message: {
		content: string;
		timestamp: number;
		fromuid: number;
		roomId: string;
		messageId: number;
		fromUser: {
			username: string;
			userslug: string;
			picture: string;
			status: string;
			uid: number;
			'icon:text': string;
			'icon:bgColor': string;
		};
		self: number;
		timestampISO: string;
		newSet: boolean;
		cleanedContent: string;
		mid: number;
	};
	self: number;
}

interface NotificationArgs {
	bodyShort: string;
	bodyLong: string;
	nid: string;
	pid: number;
	tid: number;
	from: number;
	path: string;
	important: number;
	datetime: number;
}

const factory: ModuleFactory = async ( { socket, messageQueue, actionQueue } ) => {
	actionQueue.enqueue( () => api.meta.rooms.leaveCurrent( { socket } ) );
	actionQueue.enqueue( () => api.meta.rooms.enter( { socket, enter: 'topic_14084' } ) );

	const handlers = new Map<string, Function>();

	handlers.set( 'event:chats.receive', ( args: ChatReceiveArgs ) => {
		if( args.self ) {
			return;
		}
		const { roomId, message: { content: message } } = args;
		actionQueue.enqueue( () => api.modules.chats.send( { socket, roomId, message } ) );
	} );
	handlers.set( 'event:new_post', ( args: NewPostArgs ) => {
		console.log( args );
		for( let { pid, tid, content, selfPost, ip, user: { userslug } } of args.posts ) {
			if( selfPost || ip ) {
				continue;
			}
			if( !/@error_bot/i.test( content ) ) {
				continue;
			}
			actionQueue.enqueue( () => api.posts.reply( { socket, toPid: pid, tid, content: `@${userslug}\n\n${content}` } ) );
		}
	} );
	handlers.set( 'event:new_notification', ( args: NotificationArgs ) => {
		const { bodyLong, pid, tid } = args;
		actionQueue.enqueue( () => api.posts.reply( { socket, toPid: pid, tid, content: bodyLong } ) );
	} );
	return {
		tick() {
			const promise = messageQueue.dequeue();
			if( !promise ) {
				return;
			}

			promise.then( ( [ message, args ] ) => {
				const handler = handlers.get( message );
				if( !handler ) {
					return;
				}
				handler( ...args );
			} );
		}
	};
};

export default factory;
