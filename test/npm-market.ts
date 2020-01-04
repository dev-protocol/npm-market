import {utils} from 'ethers'
import {waitForMutation} from './utils'
const contracts = artifacts.require
const isLocal = process.env.LOCAL ?? false

console.log(`The current using network is ${isLocal ? 'local' : 'not local'}.`)

contract('NpmMarket', ([deployer]) => {
	describe('authenticate', () => {
		it('authenticate npm package and calling Market.authenticatedCallback', async () => {
			const queryAuthn = await (isLocal
				? contracts('QueryNpmAuthenticationTest')
				: contracts('QueryNpmAuthentication')
			).new()
			const queryDownloads = await (isLocal
				? contracts('QueryNpmDownloadsTest')
				: contracts('QueryNpmDownloads')
			).new()
			const npm = await contracts('NpmMarket').new(
				queryAuthn.address,
				queryDownloads.address
			)
			const market = await contracts('Market').new(npm.address)
			await queryAuthn.charge({
				from: deployer,
				value: '1000000000000000'
			})
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'

			await market.authenticate(
				property,
				':TEST_PACKAGE:',
				':TEST_TOKEN:',
				'',
				'',
				''
			)
			if (isLocal) {
				await queryAuthn.__callback(utils.formatBytes32String('query_id'), '1')
			}

			await waitForMutation(
				async () => (await market.lastProperty()) === property,
				1000
			)

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
