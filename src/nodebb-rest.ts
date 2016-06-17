import { userAgent, baseUrl } from './config';
import * as rp from 'request-promise';
import NodeBBSession from './nodebb-session';

export default class NodeBBRest {
	public get( { session: { jar, config }, path, qs = {}, json = false }: { session: NodeBBSession, path: string, qs?: Object, json?: boolean } ) {
		const headers = { 'User-Agent': userAgent };
		if( config ) {
			headers[ 'X-CSRF-Token' ] = config.csrf_token;
		}
		return rp( {
			uri: `${baseUrl}${path}`,
			method: 'GET',
			jar,
			headers,
			qs,
			json
		} );
	}

	public post( { session: { jar, config }, path, qs = {}, body = {}, form = {}, json = false }: { session: NodeBBSession, path: string, qs?: Object, body?: Object, form?: Object, json?: boolean } ) {
		const headers = { 'User-Agent': userAgent };
		if( config ) {
			headers[ 'X-CSRF-Token' ] = config.csrf_token;
		}
		return rp( {
			uri: `${baseUrl}${path}`,
			method: 'POST',
			jar,
			headers,
			qs,
			body,
			form,
			json
		} );
	}
}
