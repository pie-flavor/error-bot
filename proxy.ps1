param( [string]$url )

function Set-Env {
	param( [string]$name, [string]$value )
	$Private:path = "env:\$name"
	Set-Item $Private:path $value
}

function Unset-Env {
	param( [string]$name )
	$Private:path = "env:\$name"
	If( Test-Path $Private:path ) {
		Remove-Item $Private:path
	}
}

$env:http_proxy = $url
$env:https_proxy = $url
if( !$url ) {
	$env:NODE_TLS_REJECT_UNAUTHORIZED = ""
	Write-Output "Proxy unset"
} else {
	$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
	Write-Output "Proxy set to $url"
}
