import { proxy } from '~data/config.yaml';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';

import { URL } from 'url';

export function getAgent( url: string|URL ) {
	if( !proxy ) return undefined;
	if( typeof url === 'string' ) url = new URL( url );

	const proxyUrl = new URL( proxy );

	switch( proxyUrl.protocol ) {
	case 'ws:':
	case 'http:': return new HttpProxyAgent( proxy );
	case 'wss:':
	case 'https:': return new HttpsProxyAgent( proxy );
	default: throw new Error( `Unsupported proxy: ${proxy}` );
	}
}

if( module.hot ) {
	module.hot.accept();
}
