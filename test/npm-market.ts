import {waitForMutation} from './utils'
import {
	QueryNpmAuthenticationInstance,
	QueryNpmDownloadsInstance,
	NpmMarketInstance,
	MarketInstance,
	AllocatorInstance
} from '../types/truffle-contracts'
const contracts = artifacts.require

const init = async (
	deployer: string
): Promise<{
	queryAuthn: QueryNpmAuthenticationInstance
	queryDownloads: QueryNpmDownloadsInstance
	npm: NpmMarketInstance
	market: MarketInstance
	allocator: AllocatorInstance
}> => {
	const queryAuthn = await contracts('QueryNpmAuthentication').new()
	const queryDownloads = await contracts('QueryNpmDownloads').new()
	const npm = await contracts('NpmMarket').new(
		queryAuthn.address,
		queryDownloads.address
	)
	const market = await contracts('Market').new(npm.address)
	const allocator = await contracts('Allocator').new(npm.address)
	await Promise.all([
		queryAuthn.charge({
			from: deployer,
			value: '1000000000000000'
		}),
		queryDownloads.charge({
			from: deployer,
			value: '1000000000000000'
		})
	])
	return {queryAuthn, queryDownloads, npm, market, allocator}
}

contract('NpmMarket', ([deployer]) => {
	describe('authenticate', () => {
		it('authenticate npm package and calling Market.authenticatedCallback', async () => {
			const {market} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'

			await market.authenticate(
				property,
				':TEST_PACKAGE:',
				':TEST_TOKEN:',
				'',
				'',
				''
			)

			await waitForMutation(
				async () => (await market.lastProperty()) === property,
				1000
			)

			expect(await market.lastProperty()).to.be.equal(property)
		})
		it('should fail to authenticate npm package when invalid token', async () => {
			const {market} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'

			await market.authenticate(
				property,
				':TEST_PACKAGE:',
				'INCORRECT_TOKEN',
				'',
				'',
				''
			)

			const res = await waitForMutation(
				async () => (await market.lastProperty()) === property
			).catch((err: Error) => err)

			expect(await market.lastProperty()).to.be.not.equal(property)
			expect(res).to.be.an.instanceOf(Error)
		})
	})
	describe('calculate', () => {
		const prepare = async (
			deployer: string,
			propertyAsMetrics: string
		): ReturnType<typeof init> => {
			const _contracts = await init(deployer)

			await _contracts.market.authenticate(
				propertyAsMetrics,
				':TEST_PACKAGE:',
				':TEST_TOKEN:',
				'',
				'',
				''
			)
			await waitForMutation(
				async () =>
					(await _contracts.market.lastProperty()) === propertyAsMetrics
			)
			return _contracts
		}

		it('calculate downloads count of npm package during the passd period and calling Allocator.calculatedCallback', async () => {
			const {allocator, queryDownloads} = await prepare(
				deployer,
				'0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'

			const {1: _block} = await queryDownloads.getBaseTime()
			const block = _block.toNumber()
			const DaysLater30 = block + (87400 * 30) / 15
			await allocator.allocate(metrics, block, DaysLater30)

			await waitForMutation(
				async () => (await allocator.lastMetricsAddress()) === metrics
			)
			expect(await allocator.lastMetricsAddress()).to.be.equal(metrics)
			expect(
				await allocator.lastMetricsValue().then(x => x.toNumber())
			).to.be.equal(0)
		})
		it('calculate target period by the passed two block-number')
		it('should fail to calculate when pass other than Metrics address')
	})
})
