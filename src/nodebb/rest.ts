import { userAgent, baseUrl } from '~data/config.yaml';
import rp, { RequestPromiseOptions } from 'request-promise';
import { NodeBBSession } from './session';
import _ from 'lodash';
import { URL } from 'url';

import { getAgent } from '~proxy-agent';

type QueryString = object|string;

export function get( { session, path, qs, json = false, options = {} }: { session: NodeBBSession, path: string, qs?: QueryString, json?: boolean, options?: Partial<RequestPromiseOptions> } ) {
	const { jar } = session;
	const config = session.config.value;
	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
		headers[ 'X-CSRF-Token' ] = config.csrf_token;
	}
	if( config && config[ 'cache-buster' ] ) {
		const cb = Object.fromEntries( new URLSearchParams( config[ 'cache-buster' ] ).entries() );
		qs = _.merge( {}, cb, qs );
	}
	const url = new URL( path, baseUrl );
	return rp( {
		agent: getAgent( url ),
		uri: url.href,
		method: 'GET',
		jar,
		headers,
		qs,
		json,
		...options
	} );
}

export function post( { session, path, qs, body, form, formData, json = false, options = {} }: { session: NodeBBSession, path: string, qs?: QueryString, body?: string|Buffer, form?: Object, formData?: Object, json?: boolean, options?: Partial<RequestPromiseOptions> } ) {
	const { jar } = session;
	const config = session.config.value;

	const headers = { 'User-Agent': userAgent };
	if( config && config.csrf_token ) {
		headers[ 'X-CSRF-Token' ] = config.csrf_token;
	}
	const url = new URL( path, baseUrl );
	return rp( {
		agent: getAgent( url ),
		uri: url.href,
		method: 'POST',
		jar,
		headers,
		qs,
		body,
		form,
		formData,
		json,
		...options
	} );
}

if( module.hot ) {
	module.hot.accept();
}
