/// <reference path="def/all.d.ts"/>

import q = require( 'q' );

import $http = require( 'q-io/http' );
import $apps = require( 'q-io/http-apps' );

import extend = require( 'node.extend' );

import url2 = require( 'url2' );

import uuid = require( 'node-uuid' );

module Discourse {
	var encoding = 'utf-8';

	function encode( obj: Object ) {
		var arr = [];
		for( var i in obj ) if( obj.hasOwnProperty( i ) ) {
			arr.push( [ i, obj[ i ] ] );
		}
		return arr.map( kvp => kvp.map( v => encodeURIComponent( v ) ).join( '=' ) ).join( '&' );
	}

	export class Session {
		constructor( settings: Settings ) {
			this.settings = settings;
			this.reset();
		}

		private req( method: string, url: string, data?: Object, headers?: Object ) {
			var uri = url2.parse( this.settings.baseUrl + url );

			var getParams = q.resolve<any>( {
					path: uri.path,
					method: method,
					charset: encoding,
					headers: extend( {}, headers, {
						'User-Agent': 'error-bot ' + this.settings.version,
						host: uri.hostname // key must be lowercase
					} ),
					body: []
				} );

			if( this.settings.proxy ) {
				getParams = getParams.then( params => {
					delete params.url;
					var proxy = url2.parse( this.settings.proxy );
					params.host = proxy.hostname;
					params.port = proxy.port;
					return params;
				} );
			}

			if( method !== 'GET' ) {
				getParams = getParams.then( params =>
					this.getCsrf()
					.then( csrf => {
						extend( params.headers, {
							'X-CSRF-Token': csrf
						} );
						return params;
					} )
				)
			}

			if( data ) {
				getParams = getParams.then( params => {
					var body = encode( data );
					params.body = [ body ];
					extend( params.headers, {
						'Content-Type': 'application/x-www-form-urlencoded; charset=' + encoding,
						'Content-Length': Buffer.byteLength( body )
					} );
					return params;
				} );
			}

			return getParams.then( params => this.request( params ) );
		}

		private post( url: string, data?: Object, headers?: Object ) {
			return this.req( 'POST', url, data, headers );
		}

		private postJSON( url: string, data?: Object, headers?: Object ) {
			return this.post( url, data, extend( {}, { Accept: 'application/json' }, headers ) )
				.get( 'body' )
				.invoke( 'read' )
				.invoke( 'toString', encoding )
				.then( JSON.parse );
		}

		private get( url: string, headers?: Object ) {
			return this.req( 'GET', url, null, headers );
		}

		private getJSON( url: string, headers?: Object ) {
			return this.get( url, extend( {}, { Accept: 'application/json' }, headers ) )
				.get( 'body' )
				.invoke( 'read' )
				.invoke( 'toString', encoding )
				.then( JSON.parse );
		}

		public logIn() {
			this.reset();

			return this.postJSON( 'session', {
				login: this.settings.account.username,
				password: this.settings.account.password
			} );
		}

		public messageBus() {
			return this.postJSON( 'message-bus/' + this.clientId + '/poll' );
		}

		private getCsrf() {
			if( !this.csrfPromise ) this.csrfPromise = this.getJSON( 'session/csrf' ).get( 'csrf' );
			return this.csrfPromise;
		}

		public reset() {
			this.csrfPromise = null;
			this.request = $apps.CookieJar( $http.request );
			this.clientId = uuid.v4();
		}

		public reply( text: string, topicId: number, categoryId: number ) {
			return this.postJSON( 'posts', {
				raw: text + '\n<!-- Posted by: error-bot ' + this.settings.version + ' -->\n',
				topic_id: topicId,
				category: categoryId,
				is_warning: false,
				archetype: 'regular'
			} );
		}

		private csrfPromise: q.IPromise<string>;
		private request: ( request: $http.Request ) => q.Promise<$http.Response>;
		private clientId: string;
		private settings: Settings;
	}

	export interface BadgeType {
		id: number;
		name: string;
		sort_order: number;
	}

	export interface Badge {
		allow_title: boolean;
		badge_grouping_id: number;
		badge_type_id: number;
		description: string;
		enabled: boolean;
		grant_count: number;
		icon: string;
		id: number;
		image: string;
		listable: boolean;
		multiple_grant: boolean;
		name: string;
		system: boolean;
	}

	export interface UserBadge {
		badge_id: number;
		granted_at: string;
		granted_by_id: number;
		id: number;
		user_id: number;
	}

	export interface Topic {
		fancy_title: string;
		id: number;
		posts_count: number;
		slug: string;
		title: string;
	}

	export interface User {
		admin: boolean;
		avatar_template: string;
		badge_count: string;
		bio_cooked: string;
		bio_excerpt: string;
		bio_raw: string;
		can_edit: boolean;
		can_edit_email: boolean;
		can_edit_name: boolean;
		can_edit_username: boolean;
		can_send_private_message_to_user: boolean;
		can_send_private_messages: boolean;
		card_badge: {};
		created_at: string;
		custom_fields: {};
		custom_groups: {};
		featured_user_badge_ids: Array<number>;
		id: number;
		invited_by: {};
		last_posted_at: string;
		last_seen_at: string;
		location: string;
		moderator: boolean;
		name: string;
		stats: Array<Action>;
		title: string;
		trust_level: number;
		uploaded_avatar_id: number;
		username: string;
		website: string;
	}

	export interface UserSmall {
		avatar_template: string;
		id: number;
		uploaded_avatar_id: number;
		username: string;
	}

	export interface Action {
		action_type: number;
		count: number;
		id: number;
	}

	export enum PostActionType {
		Bookmark = 1,
		Like = 2,
		OffTopic = 3,
		Inappropriate = 4,
		Vote = 5,
		NotifyUser = 6,
		NotifyModerators = 7,
		Spam = 8
	}

	export enum NotificationLevel {
		Muted = 0,
		Regular = 1,
		Tracking = 2,
		Watching = 3
	}
}

export = Discourse;