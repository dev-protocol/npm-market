const handler = function(deployer) {
	const npmAuthn = artifacts.require('QueryNpmAuthentication')
	const npmDownloads = artifacts.require('QueryNpmDownloads')
	deployer.deploy(
		artifacts.require('NpmMarket'),
		npmAuthn.address,
		npmDownloads.address
	)
} as Truffle.Migration

export = handler
