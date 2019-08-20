import { NodeBBSession } from './session';
import * as rest from './rest';
import { NodeBBSocket } from './socket';
import { tagUrl } from '~util';

type SessionOpts = { session: NodeBBSession };
type SocketOpts = { socket: NodeBBSocket };

const notImplemented = () => { throw new Error( 'Not implemented' ); };

export async function getConfig( { session }: SessionOpts ) {
	const config = await rest.get( {
		session,
		path: '/api/config',
		json: true
	} );
	session.config.next( config );
	return config;
}

export function normalizeUsername( username: string ) {
	return username.toLowerCase().replace( /^@/, '' );
}

async function ensureConfig( { session }: SessionOpts ) {
	if( session.config.value == null ) {
		await getConfig( { session } );
	}
}

interface GetRoomIdParams {
	readonly cid: number|string;
	readonly uid: number|string;
	readonly tid: number|string;
	readonly recent: true;
	readonly unread: true;
	readonly popular: true;
	readonly admin: true;
	readonly categories: true;
}

export function getRoomId( opts: PickOnly<GetRoomIdParams, 'cid'> ): string;
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'tid'> ): string;
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'uid'> ): string;
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'recent'> ): 'recent_topics';
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'unread'> ): 'unread_topics';
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'popular'> ): 'popular_topics';
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'admin'> ): 'admin';
export function getRoomId( opts: PickOnly<GetRoomIdParams, 'categories'> ): 'categories';
export function getRoomId( opts: any ): string {
	if( [ 'number', 'string' ].includes( typeof opts.uid ) ) return `user/${opts.uid}`;
	if( [ 'number', 'string' ].includes( typeof opts.cid ) ) return `category_${opts.cid}`;
	if( [ 'number', 'string' ].includes( typeof opts.tid ) ) return `topic_${opts.cid}`;
	if( opts.recent ) return 'recent_topics';
	if( opts.unread ) return 'unread_topics';
	if( opts.popular ) return 'popular_topics';
	if( opts.admin ) return 'admin';
	if( opts.categories ) return 'categories';
	throw new Error( 'Could not get room ID' );
}

export async function compose( { session, content }: SessionOpts & { readonly content: string; readonly cid: number; readonly title: string; tags: readonly string[]; readonly thumb: string; } );
export async function compose( { session, content }: SessionOpts & { readonly content: string; readonly tid: number; } );
export async function compose( { session, ...form }: SessionOpts & { readonly content: string; } & ( { readonly cid: number; readonly title: string; tags: readonly string[]; readonly thumb: string; } | { readonly tid: number; } ) ) {
	return await rest.post( {
		session,
		path: '/compose',
		form,
		options: {
			json: false,
			followRedirect: false,
			resolveWithFullResponse: true
		}
	} );
}

export namespace auth {
	export async function logOut( { session }: SessionOpts ) {
		await ensureConfig( { session } );
		await rest.post( {
			session,
			path: '/logout'
		} );
		await getConfig( { session } );
	}

	export async function logIn( { session, username, password }: SessionOpts & { username: string, password: string } ) {
		await ensureConfig( { session } );
		await rest.post( {
			session,
			path: '/login',
			form: { username, password }
		} );
		await getConfig( { session } );
	}
}

export namespace blacklist {
	export function save( { socket, rules }: SocketOpts & { rules: string; } ) {
		return socket.emit( 'blacklist.save', rules );
	}

	export function validate( { socket, rules }: SocketOpts & { rules: string; } ) {
		return socket.emit( 'blacklist.validate', { rules } );
	}
}

export namespace admin {
	export namespace analytics {
		export function get( { socket, graph, units, until, amount }: SocketOpts & { graph: string; units: string; until: number; amount: number; } ) {
			return socket.emit( 'admin.analytics.get', { graph, units, until, amount } );
		}
	}

	export namespace categories {
		export function copyPrivilegesFrom( { socket, fromCid, toCid, group }: SocketOpts & { fromCid: number; toCid: number; group: string; } ) {
			return socket.emit( 'admin.categories.copyPrivilegesFrom', { fromCid, toCid, group } );
		}

		export function copyPrivilegesToAllCategories( { socket, cid, group }: SocketOpts & { cid: number; group: string; } ) {
			return socket.emit( 'admin.categories.copyPrivilegesToAllCategories', { cid, group } );
		}

		export function copyPrivilegesToChildren( { socket, cid, group }: SocketOpts & { cid: number; group: string; } ) {
			return socket.emit( 'admin.categories.copyPrivilegesToChildren', { cid, group } );
		}

		export const create = notImplemented;

		export function getAll( { socket }: SocketOpts ) {
			return socket.emit( 'admin.categories.getAll' );
		}

		export function getPrivilegeSettings( { socket, cid }: SocketOpts & { cid: number; } ) {
			return socket.emit( 'admin.categories.getPrivilegeSettings', cid );
		}

		export function setPrivilege( { socket, cid, privilege, set, member }: SocketOpts & { cid: number; privilege: readonly NodeBB.Privilege[]; set: boolean; member: string; } ) {
			return socket.emit( 'admin.categories.getPrivilegeSettings', { cid, privilege, set, member } );
		}

		export function update( { socket, disabled }: SocketOpts & { disabled: Record<number, 0|1> } ) {
			return socket.emit( 'admin.categories.update', disabled );
		}
	}

	export function deleteAllEvents( { socket }: SocketOpts ): Promise<void> {
		return socket.emit( 'admin.deleteAllEvents' );
	}

	export function deleteAllSessions( { socket }: SocketOpts ): Promise<void> {
		return socket.emit( 'admin.deleteAllSessions' );
	}

	export function deleteEvents( { socket, eids }: SocketOpts & { eids: readonly number[]; } ): Promise<void> {
		return socket.emit( 'admin.deleteEvents', eids );
	}

	export namespace email {
		export function test( { socket, template }: SocketOpts & { template: string; } ): Promise<void> {
			return socket.emit( 'admin.email.test', { template } );
		}
	}

	export namespace errors {
		export function clear( { socket }: SocketOpts ) {
			return socket.emit( 'admin.errors.clear', {} );
		}
	}

	export function getSearchDict( { socket }: SocketOpts ) {
		return socket.emit( 'admin.getSearchDict', {} );
	}

	export namespace groups {
		export function create( { socket, name, description }: SocketOpts & { name: string; description: string; } ): Promise<void> {
			return socket.emit( 'admin.groups.create', { name, description } );
		}
	}

	export namespace logs {
		export function clear( { socket }: SocketOpts ): Promise<void> {
			return socket.emit( 'admin.logs.clear' );
		}

		export function get( { socket }: SocketOpts ): Promise<string> {
			return socket.emit( 'admin.logs.get' );
		}
	}

	export namespace navigation {
		export function save( { socket, nav }: SocketOpts & { nav: readonly Record<string, string|boolean>[] } ) {
			return socket.emit( 'admin.navigation.save', nav );
		}
	}

	export namespace plugins {
		export function getActive( { socket }: SocketOpts ) {
			return socket.emit( 'admin.plugins.getActive' );
		}

		export function orderActivePlugins( { socket, data }: SocketOpts & { data: readonly { readonly name: string; readonly order: number; }[]; } ) {
			return socket.emit( 'admin.plugins.orderActivePlugins', data );
		}

		export function toggleActive( { socket, id }: SocketOpts & { id: string; } ) {
			return socket.emit( 'admin.plugins.toggleActive', id );
		}

		export function toggleInstall( { socket, id, version }: SocketOpts & { id: string; version: string; } ) {
			return socket.emit( 'admin.plugins.toggleInstall', { id, version } );
		}

		export function upgrade( { socket, id, version }: SocketOpts & { id: string; version: string; } ) {
			return socket.emit( 'admin.plugins.upgrade', { id, version } );
		}
	}

	export function reload( { socket }: SocketOpts ) {
		return socket.emit( 'admin.reload' );
	}

	export function restart( { socket }: SocketOpts ) {
		return socket.emit( 'admin.restart' );
	}

	export namespace settings {
		export function clearSitemapCache( { socket }: SocketOpts ) {
			return socket.emit( 'admin.settings.clearSitemapCache' );
		}

		export function get( { socket, hash }: SocketOpts & { hash: string; } ) {
			return socket.emit( 'admin.settings.get', { hash } );
		}

		export function remove( { socket, key }: SocketOpts & { key: string; } ) {
			return socket.emit( 'admin.settings.remove', key );
		}

		export function set( { socket, hash, values }: SocketOpts & { hash: string; values: Record<string, any> } ) {
			return socket.emit( 'admin.settings.set', { hash, values } );
		}
	}

	export namespace tags {
		export function create( { socket, tag }: SocketOpts & { tag: string; } ) {
			return socket.emit( 'admin.tags.create', tag );
		}

		export function deleteTags( { socket, tags }: SocketOpts & { tags: readonly string[]; } ) {
			return socket.emit( 'admin.tags.deleteTags', { tags } );
		}

		export function update( { socket, tags }: SocketOpts & { tags: readonly { readonly bgColor: string; readonly color: string; readonly value: string; }[] } ) {
			return socket.emit( 'admin.tags.update', tags );
		}

		export function rename( { socket, tags }: SocketOpts & { tags: readonly { readonly newName: string; readonly value: string; } [] } ) {
			return socket.emit( 'admin.tags.rename', tags );
		}
	}

	export namespace social {
		export function rename( { socket, networks }: SocketOpts & { networks: readonly string[] } ) {
			return socket.emit( 'admin.social.savePostSharingNetworks', networks );
		}
	}

	export namespace themes {
		export function set( { socket, type, id, src }: SocketOpts & { type: string; id: string; src: string; } ) {
			return socket.emit( 'admin.themes.set', { type, id, src } );
		}
	}

	export namespace user {

		export function deleteInvitation( { socket, email, invitedBy }: SocketOpts & { email: string; invitedBy: string; } ): Promise<void> {
			return socket.emit( 'admin.user.deleteInvitation', { email, invitedBy } );
		}

		export function deleteUsersAndContent( { socket, uids }: SocketOpts & { uids: readonly number[]; } ) {
			return socket.emit( 'admin.user.deleteUsersAndContent', { uids } );
		}

		export function acceptRegistration( { socket, username }: SocketOpts & { username: string; } ): Promise<void> {
			return socket.emit( 'admin.user.acceptRegistration', { username } );
		}

		export function rejectRegistration( { socket, username }: SocketOpts & { username: string; } ): Promise<void> {
			return socket.emit( 'admin.user.rejectRegistration', { username } );
		}

		export function makeAdmins( { socket, uids }: SocketOpts & { uids: readonly number[]; } ): Promise<void> {
			return socket.emit( 'admin.user.makeAdmins', uids );
		}

		export function removeAdmins( { socket, uids }: SocketOpts & { uids: readonly number[]; } ): Promise<void> {
			return socket.emit( 'admin.user.removeAdmins', uids );
		}

		export function restartJobs( { socket }: SocketOpts ): Promise<void> {
			return socket.emit( 'admin.user.restartJobs' );
		}
	}

	export namespace rewards {
		// TODO: fix name
		export function _delete( { socket, id }: SocketOpts & { id: string; } ) {
			return socket.emit( 'admin.rewards.delete', { id } );
		}

		export function save( { socket, data }: SocketOpts & { data: readonly ( { readonly rewards: Record<string, string>; id: string; disabled: boolean; } & Record<string, string> )[] } ) {
			return socket.emit( 'admin.rewards.save', data );
		}
	}

	export namespace rooms {
		export function getAll( { socket }: SocketOpts ) {
			return socket.emit( 'admin.rooms.getAll' );
		}
	}

	export namespace widgets {
		export function set( { socket, data }: SocketOpts & { data: readonly { readonly template: string; readonly location: string; readonly widgets: readonly Record<string, string>[]; }[]; } ) {
			return socket.emit( 'admin.widgets.set', data );
		}
	}
}

export namespace categories {
	export function getSelectCategories( { socket }: SocketOpts ) {
		return socket.emit( 'categories.getSelectCategories', {} );
	}

	export function setWatchState( { socket, cid, state, uid }: SocketOpts & { cid: number; state: NodeBB.WatchState; uid: number; } ) {
		return socket.emit( 'categories.setWatchState', { socket, cid, state, uid } );
	}
}

export namespace flags {
	export function create( { socket, type, id, reason }: SocketOpts & { type: string; id: string; reason: string; } ) {
		return socket.emit( 'flags.create', { type, id, reason } );
	}
}

export namespace groups {
	export async function getAll( { session, sort }: SessionOpts & { readonly sort?: 'alpha'|'count'|'date' } ) {
		await ensureConfig( { session } );
		return await rest.get( {
			session,
			path: '/api/groups',
			qs: { sort },
			json: true
		} );
	}

	export function accept( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.accept', { toUid, groupName } );
	}

	export function acceptAll( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.acceptAll', { toUid, groupName } );
	}

	export function acceptInvite( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.acceptInvite', { toUid, groupName } );
	}

	export namespace cover {
		export function remove( { socket, groupName }: SocketOpts & { groupName: string; } ) {
			return socket.emit( 'groups.cover.remove', { groupName } );
		}

		export function update( { socket, groupName, imageData }: SocketOpts & { groupName: string; imageData: string; } ) {
			return socket.emit( 'groups.cover.update', { groupName, imageData } );
		}
	}

	export function grant( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.grant', { toUid, groupName } );
	}

	export function join( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ): Promise<void> {
		return socket.emit( 'groups.join', { toUid, groupName } );
	}

	export function kick( { socket, uid, groupName }: SocketOpts & { uid: number; groupName: string; } ) {
		return socket.emit( 'groups.kick', { uid, groupName } );
	}

	export function leave( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ): Promise<void> {
		return socket.emit( 'groups.leave', { toUid, groupName } );
	}

	export function rescind( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.rescind', { toUid, groupName } );
	}

	export function rescindInvite( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.rescindInvite', { toUid, groupName } );
	}

	export function reject( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.reject', { toUid, groupName } );
	}

	export function rejectAll( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.rejectAll', { toUid, groupName } );
	}

	export function rejectInvite( { socket, toUid, groupName }: SocketOpts & { toUid: number; groupName: string; } ) {
		return socket.emit( 'groups.rejectInvite', { toUid, groupName } );
	}

	export function search( { socket, query, options }: SocketOpts & { query?: string; options?: { readonly sort: 'alpha'|'count'|'date'; }; } ): Promise<readonly NodeBB.GroupData[]> {
		return socket.emit( 'groups.search', { query, options } );
	}
}

export namespace meta {
	export namespace rooms {
		export function leaveCurrent( { socket }: SocketOpts ): Promise<void> {
			return socket.emit( 'meta.rooms.leaveCurrent' );
		}

		export function enter( { socket }: SocketOpts & { enter: string } ): Promise<void> {
			return socket.emit( 'meta.rooms.enter', { enter } );
		}
	}

	export function reconnected( { socket }: SocketOpts ): Promise<void> {
		return socket.emit( 'meta.reconnected' );
	}
}

export namespace modules {
	export namespace chats {
		export function markAllRead( { socket }: SocketOpts ) {
			return socket.emit( 'modules.chats.markAllRead' );
		}

		export function markRead( { socket, roomId }: SocketOpts & { roomId: string; } ) {
			return socket.emit( 'modules.chats.markRead', roomId );
		}

		export async function get( { session, userslug, roomId }: SessionOpts & { userslug: string; roomId: string; } ) {
			await ensureConfig( { session } );
			return await rest.get( {
				session,
				path: tagUrl`/api/user/${userslug}/chats/${roomId}`,
				json: true
			} );
		}

		export async function getAll( { session, userslug, qs = {} }: SessionOpts & { userslug: string; qs?: any; } ) {
			await ensureConfig( { session } );
			return await rest.get( {
				session,
				path: tagUrl`/api/user/${userslug}/chats`,
				json: true,
				qs
			} );
		}

		export function getRecentChats( { socket, uid, after = 0 }: SocketOpts & { uid: number, after?: number; } ) {
			return socket.emit( 'modules.chats.getRecentChats', { uid, after } );
		}

		export function loadRoom( { socket, roomId, uid }: SocketOpts & { roomId: string; uid: number; } ) {
			return socket.emit( 'modules.chats.loadRoom', { roomId, uid } );
		}

		export function newRoom( { socket, touid }: SocketOpts & { touid: number } ) {
			return socket.emit( 'modules.chats.newRoom', { touid } );
		}

		export function getMessages( { socket, roomId, uid, start }: SocketOpts & { roomId: string; uid: number; start?: number; } ) {
			return socket.emit( 'modules.chats.getMessages', { roomId, uid, start } );
		}

		export function isDnD( { socket, touid }: SocketOpts & { touid: number } ) {
			return socket.emit( 'modules.chat.isDnD', touid );
		}

		export function hasPrivateChat( { socket, uid }: SocketOpts & { uid: number } ): Promise<string> {
			return socket.emit( 'modules.chats.hasPrivateChat', uid );
		}

		export function getIP( { socket, mid }: SocketOpts & { mid: number } ): Promise<string> {
			return socket.emit( 'modules.chats.getIP', mid );
		}

		export function edit( { socket, roomId, mid, message }: SocketOpts & { roomId: string; mid: number; message: string; } ) {
			return socket.emit( 'modules.chats.edit', { roomId, mid, message } );
		}

		export function send( { socket, roomId, message }: SocketOpts & { roomId: string; message: string; } ) {
			return socket.emit( 'modules.chats.send', { roomId, message } );
		}
	}

	export namespace sounds {
		export function getUserSoundMap( { socket }: SocketOpts ): Promise<Record<string, string>> {
			return socket.emit( 'modules.sounds.getUserSoundMap' );
		}
	}
}

export namespace notifications {
	export function get( { socket }: SocketOpts ): Promise<{
		readonly read: readonly NodeBB.Notification[];
		readonly unread: readonly NodeBB.Notification[];
	}> {
		return socket.emit( 'notifications.get', null );
	}

	export function getCount( { socket }: SocketOpts ) {
		return socket.emit( 'notifications.getCount' );
	}

	export function markAllRead( { socket }: SocketOpts ) {
		return socket.emit( 'notifications.markAllRead' );
	}

	export function markRead( { socket, nid }: SocketOpts & { nid: string } ) {
		return socket.emit( 'notifications.markRead', nid );
	}

	export function markUnread( { socket, nid }: SocketOpts & { nid: string } ) {
		return socket.emit( 'notifications.markUnread', nid );
	}
}

export namespace plugins {
	export function shortcuts( { socket }: SocketOpts ) {
		return socket.emit( 'plugins.shortcuts', null );
	}
}

export namespace posts {
	export function deletePosts( { socket, tid, pids }: SocketOpts & { tid: number; pids: readonly number[]; } ) {
		return socket.emit( 'posts.deletePosts', { tid, pids } );
	}

	export function purgePosts( { socket, tid, pids }: SocketOpts & { tid: number; pids: readonly number[]; } ) {
		return socket.emit( 'posts.purgePosts', { tid, pids } );
	}

	export function getDiffs( { socket, pid }: SocketOpts & { pid: number; } ) {
		return socket.emit( 'posts.getDiffs', { pid } );
	}

	export function getReplies( { socket, pid }: SocketOpts & { pid: number; } ) {
		return socket.emit( 'posts.getReplies', pid );
	}

	export function showPostAt( { socket, pid, since }: SocketOpts & { pid: number; since: number; } ) {
		return socket.emit( 'posts.showPostAt', { pid, since } );
	}

	export function loadPostTools( { socket, cid, pid }: SocketOpts & { cid: number; pid: number; } ) {
		return socket.emit( 'posts.loadPostTools', { cid, pid } );
	}

	export function getTimestampByIndex( { socket, tid, index }: SocketOpts & { tid: number; index: number; } ) {
		return socket.emit( 'posts.getTimestampByIndex', { tid, index } );
	}

	export function getUpvoters( { socket, pids }: SocketOpts & { pids: readonly number[]; } ) {
		return socket.emit( 'posts.getUpvoters', pids.map( String ) );
	}

	export function getPidIndex( { socket, pid, tid, topicPostSort }: SocketOpts & { pid: number; tid: number; topicPostSort: string; } ) {
		return socket.emit( 'posts.getPidIndex', { pid, tid, topicPostSort } );
	}

	export function downvote( { socket, pid, roomId }: SocketOpts & { pid: number, roomId: string } ) {
		return socket.emit( 'posts.downvote', { pid: String( pid ), room_id: roomId } );
	}

	export function unvote( { socket, pid, roomId }: SocketOpts & { pid: number, roomId: string } ) {
		return socket.emit( 'posts.unvote', { pid: String( pid ), room_id: roomId } );
	}

	export function upvote( { socket, pid, roomId }: SocketOpts & { pid: number, roomId: string } ) {
		return socket.emit( 'posts.upvote', { pid: String( pid ), room_id: roomId } );
	}

	export function reply( { socket, tid, content, toPid = null, lock = false }: SocketOpts & { tid: number, content: string, toPid?: number, lock?: boolean } ) {
		return socket.emit( 'posts.reply', { tid, content, toPid, lock } );
	}

	export function movePosts( { socket, pids, tid }: SocketOpts & { pids: readonly number[]; tid: number; } ) {
		return socket.emit( 'posts.movePosts', { pids, tid } );
	}

	export async function upload( { session, filename, buffer, contentType, cid }: SessionOpts & { filename: string, buffer: Buffer, contentType: string, cid?: number } ) {
		await ensureConfig( { session } );

		const [ { url } ]: [ { url: string } ] =
			await rest.post( {
				session,
				path: '/api/post/upload',
				formData: {
					...( cid ? { cid } : {} ),
					'files[]': [ {
						value: buffer,
						options: {
							filename,
							contentType
						}
					} ]
				},
				json: true
			} );
		return url;
	}
}


export namespace topics {
	export function bookmark( { socket, tid, index }: SocketOpts & { tid: number, index: number } ) {
		return socket.emit( 'topics.bookmark', { tid, index } );
	}

	export function changeWatching( { socket, tid, type }: SocketOpts & { tid: number; type: NodeBB.WatchState; } ): Promise<void> {
		return socket.emit( 'topics.changeWatching', { tid, type } );
	}

	export function createTopicFromPosts( { socket, title, pids, fromTid }: SocketOpts & { title: string; pids: readonly number[]; fromTid: number; } ) {
		return socket.emit( 'topics.createTopicFromPosts', { title, pids, fromTid } );
	}

	export function _delete( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.delete', { tids, cid } );
	}

	export async function get( { session, tid, page = 1 }: SessionOpts & { tid: number; page?: number; } ): Promise<NodeBB.TopicData> {
		await ensureConfig( { session } );
		return await rest.get( {
			session,
			path: tagUrl`/api/topic/${tid}`,
			json: true,
			qs: { page }
		} );
	}

	export function markAsRead( { socket, tids }: SocketOpts & { tids: readonly number[]; } ) {
		return socket.emit( 'topics.markAsRead', tids );
	}

	export function markTopicNotificationsRead( { socket, tids }: SocketOpts & { tids: readonly number[]; } ) {
		return socket.emit( 'topics.markTopicNotificationsRead', tids );
	}

	export function pin( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.pin', { tids, cid } );
	}

	export function lock( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.lock', { tids, cid } );
	}

	export function purge( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.purge', { tids, cid } );
	}

	export function unlock( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.unlock', { tids, cid } );
	}

	export function restore( { socket, tids, cid }: SocketOpts & { tids: readonly number[]; cid: number; } ) {
		return socket.emit( 'topics.restore', { tids, cid } );
	}

	export function search( { socket, tid, term }: SocketOpts & { tid: number; term: string; } ): Promise<readonly number[]> {
		return socket.emit( 'topics.search', { tid, term } );
	}

	export function searchAndLoadTags( { socket, query }: SocketOpts & { query: string; } ) {
		return socket.emit( 'topics.searchAndLoadTags', { query } );
	}

	export function loadMoreTags( { socket, after }: SocketOpts & { after: number; } ) {
		return socket.emit( 'topics.loadMoreTags', { after } );
	}
}

export namespace user {
	export async function get( { session, userslug }: SessionOpts & { readonly userslug: string } ): Promise<{
		readonly uid: number;
		readonly username: string;
		readonly userslug: string;
		readonly banned: boolean;
		readonly groups: readonly NodeBB.GroupData[];
	}> {
		return await rest.get( { session, path: tagUrl`/api/user/${userslug}` } );
	}

	export function banUsers( { socket, uids, until = 0, reason = '' }: SocketOpts & { uids: readonly number[]; until?: number; reason?: string; } ) {
		return socket.emit( 'user.banUsers', { uids, until, reason } );
	}

	export function unbanUsers( { socket, uids }: SocketOpts & { uids: readonly number[]; } ) {
		return socket.emit( 'user.unbanUsers', uids );
	}

	export function changePassword( { socket, currentPassword, newPassword, uid }: SocketOpts & { currentPassword: string; newPassword: string; uid: number } ) {
		return socket.emit( 'user.changePassword', { currentPassword, newPassword, uid } );
	}

	export function changePicture( { socket, type, uid }: SocketOpts & { type: string; uid: number; } ) {
		return socket.emit( 'user.changePicture', { type, uid } );
	}

	export function changeUsernameEmail( { socket, uid, email, password }: SocketOpts & { uid: number; email: string; password: string; } ) {
		return socket.emit( 'user.changeUsernameEmail', { uid, email, password } );
	}

	export function deleteAccount( { socket, password }: SocketOpts & { password: string; } ) {
		return socket.emit( 'user.deleteAccount', { password } );
	}

	export function deleteUpload( { socket, name, uid }: SocketOpts & { name: string; uid: number; } ) {
		return socket.emit( 'user.deleteUpoad', { name, uid } );
	}

	export function emailConfirm( { socket }: SocketOpts ): Promise<void> {
		return socket.emit( 'user.emailConfirm', {} );
	}

	export function emailExists( { socket, email }: SocketOpts & { email: string; } ): Promise<boolean> {
		return socket.emit( 'user.emailExists', { email } );
	}

	export function exists( { socket, username }: SocketOpts & { username: string; } ): Promise<boolean> {
		return socket.emit( 'user.exists', { username } );
	}

	export function getProfilePictures( { socket, uid }: SocketOpts & { uid: number; } ) {
		return socket.emit( 'user.getProfilePictures', { uid } );
	}

	export function invite( { socket, email }: SocketOpts & { email: string; } ) {
		return socket.emit( 'user.invite', email );
	}

	export function removeUploadedPicture( { socket, uid }: SocketOpts & { uid: number; } ) {
		return socket.emit( 'user.removeUploadedPicture', { uid } );
	}

	export function search( { socket, query, paginate }: SocketOpts & { query: string; paginate: boolean; } ) {
		return socket.emit( 'user.search', { query, paginate } );
	}

	export function setCategorySort( { socket, sort }: SocketOpts & { sort: string; } ) {
		return socket.emit( 'user.setCategorySort', sort );
	}

	export function setTopicSort( { socket, sort }: SocketOpts & { sort: string; } ) {
		return socket.emit( 'user.setTopicSort', sort );
	}

	export function toggleBlock( { socket, blockeeUid, blockerUid }: SocketOpts & { blockeeUid: number; blockerUid: number; } ) {
		return socket.emit( 'user.toggleBlock', { blockeeUid, blockerUid } );
	}

	export function removeCover( { socket, uid }: SocketOpts & { uid: number; } ) {
		return socket.emit( 'user.removeCover', { uid } );
	}

	export function updateCover( { socket, uid, imageData }: SocketOpts & { uid: number; imageData: string; } ) {
		return socket.emit( 'user.updateCover', { uid, imageData } );
	}

	export function updateProfile( { socket, uid, fullname, website, birthday, location, groupTitle, signature, aboutme }: SocketOpts & { uid: number; fullname: string; website: string; birthday: string; location: string; groupTitle: string; signature: string; aboutme: string; } ) {
		return socket.emit( 'user.updateProfile', { uid, fullname, website, birthday, location, groupTitle, signature, aboutme } );
	}

	export function uploadCroppedPicture( { socket, uid, imageData }: SocketOpts & { uid: number; imageData: string; } ) {
		return socket.emit( 'user.uploadCroppedPicture', { uid, imageData } );
	}

	export namespace gdpr {
		export function consent( { socket }: SocketOpts ): Promise<void> {
			return socket.emit( 'user.gdpr.consent', {} );
		}
	}

	export namespace reset {
		export function send( { socket, email }: SocketOpts & { email: string; } ) {
			return socket.emit( 'user.reset.send', { email } );
		}

		export function commit( { socket, code, password }: SocketOpts & { code: string; password: string; } ) {
			return socket.emit( 'user.reset.send', { code, password } );
		}
	}
}

if( module.hot ) {
	module.hot.accept();

	module.hot.accept( './rest.ts' );
}
