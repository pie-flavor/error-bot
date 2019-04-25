import { userAgent, baseUrl } from '~data/config.yaml';
import rp from 'request-promise';
import { NodeBBSession } from './session';

import { proxy } from '~data/config.yaml';

export function get( { session: { jar, config }, path, qs, json = false }: { session: NodeBBSession, path: string, qs?: Object, json?: boolean } ) {
	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
		headers[ 'X-CSRF-Token' ] = config.csrf_token;
	}
	return rp( {
		proxy,
		uri: `${baseUrl}${path}`,
		method: 'GET',
		jar,
		headers,
		qs,
		json
	} );
}

export function post( { session: { jar, config }, path, qs, body, form, formData, json = false }: { session: NodeBBSession, path: string, qs?: Object, body?: string|Buffer, form?: Object, formData?: Object, json?: boolean } ) {
	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
		headers[ 'X-CSRF-Token' ] = config.csrf_token;
	}
	return rp( {
		proxy,
		uri: `${baseUrl}${path}`,
		method: 'POST',
		jar,
		headers,
		qs,
		body,
		form,
		formData,
		json
	} );
}


if( module.hot ) module.hot.accept( '../data/config.yaml' );
