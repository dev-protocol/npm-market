const handler = function (deployer, network) {
	if (network === 'test') {
		return
	}

	deployer.deploy(artifacts.require('QueryNpmAuthentication'))
	deployer.deploy(artifacts.require('QueryNpmDownloads'))
} as Truffle.Migration

export = handler
