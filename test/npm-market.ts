import {utils} from 'ethers'
const contracts = artifacts.require
const isLocal = process.env.LOCAL ?? false

console.log(`The current using network is ${isLocal ? 'local' : 'not local'}.`)

contract('NpmMarket', ([deployer, property]) => {
	describe('authenticate', () => {
		it('authenticate npm package and calling Market.authenticatedCallback', async () => {
			const queryAuthn = await contracts('QueryNpmAuthenticationTest').new()
			const queryDownloads = await contracts('QueryNpmDownloadsTest').new()
			const npm = await contracts('NpmMarket').new(
				queryAuthn.address,
				queryDownloads.address
			)
			const market = await contracts('Market').new(npm.address)
			await queryAuthn.charge({
				from: deployer,
				value: '1000000000000000'
			})

			await market.authenticate(
				property,
				'TEST-PACKAGE',
				'TEST_TOKEN',
				'',
				'',
				''
			)
			await queryAuthn.__callback(utils.formatBytes32String('query_id'), '1')
			expect(await market.lastProperty()).to.be.equal(property)
		})
		it('should fail to authenticate npm package when invalid read-only token')
	})
	describe('calculate', () => {
		it(
			'calculate downloads count of npm package during the passd period and calling Allocator.calculatedCallback'
		)
		it('should fail to calculate when pass other than Metrics address')
	})
})
