const handler = function (deployer, network) {
	if (network === 'test') {
		return
	}

	const npmAuthn = artifacts.require('QueryNpmAuthentication')
	const npmDownloads = artifacts.require('QueryNpmDownloads')
	deployer.deploy(
		artifacts.require('NpmMarket'),
		npmAuthn.address,
		npmDownloads.address
	)
} as Truffle.Migration

export = handler
