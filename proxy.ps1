Param ( [string]$url )

Function Set-Proxy {
	Param ( [string]$url )
	if( $url ) {
		Set-Item Env:\http_proxy $url
		Set-Item Env:\https_proxy $url
		Set-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED "0"
	} else {
		if( Test-Path Env:\http_proxy ) {
			Remove-Item Env:\http_proxy
		}
		if( Test-Path Env:\https_proxy ) {
			Remove-Item Env:\https_proxy
		}
		if( Test-Path Env:\NODE_TLS_REJECT_UNAUTHORIZED ) {
			Remove-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED
		}
	}
}

Set-Proxy $url
