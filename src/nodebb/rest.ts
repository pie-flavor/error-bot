import { userAgent, baseUrl } from '../config';
import * as rp from 'request-promise';
import Session from './session';

export function get( { session: { jar, config }, path, qs = {}, json = false }: { session: Session, path: string, qs?: Object, json?: boolean } ) {
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

export function post( { session: { jar, config }, path, qs = {}, body = {}, form = {}, json = false }: { session: Session, path: string, qs?: Object, body?: Object, form?: Object, json?: boolean } ) {
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
