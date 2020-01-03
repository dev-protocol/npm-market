const handler = function(deployer) {
	deployer.deploy(artifacts.require('QueryNpmAuthentication'))
	deployer.deploy(artifacts.require('QueryNpmDownloads'))
} as Truffle.Migration

export = handler
