import { userAgent, baseUrl } from '~data/config.yaml';
import rp from 'request-promise';
import { NodeBBSession } from './session';

export function get( { session: { jar, config }, path, qs = {}, json = false }: { session: NodeBBSession, path: string, qs?: Object, json?: boolean } ) {
	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
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

export function post( { session: { jar, config }, path, qs = {}, body = {}, form = {}, json = false }: { session: NodeBBSession, path: string, qs?: Object, body?: Object, form?: Object, json?: boolean } ) {
	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
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
