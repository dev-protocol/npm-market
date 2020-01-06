import BigNumber from 'bignumber.js'
import {format} from 'date-fns'
import * as rp from 'request-promise'
import {waitForMutation, init} from './utils'
const contracts = artifacts.require

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
		it('calculate downloads count of npm package during the passd period and calling Allocator.calculatedCallback', async () => {
			const {queryAuthn, queryDownloads} = await init(deployer)
			const npmTest = await contracts('NpmMarketTest').new(
				queryAuthn.address,
				queryDownloads.address
			)
			const allocator = await contracts('Allocator').new(npmTest.address)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			await npmTest.setPackages('npm', metrics)

			const {1: _block} = await queryDownloads.getBaseTime()
			const block = _block.toNumber()
			await allocator.allocate(metrics, block, block)

			await waitForMutation(
				async () => (await allocator.lastMetricsAddress()) === metrics
			)
			expect(await allocator.lastMetricsAddress()).to.be.equal(metrics)
			expect(
				await allocator.lastMetricsValue().then((x: BigNumber) => x.toNumber())
			).to.be.equal(0)
		})
		it('calculate target period by the passed two block-number', async () => {
			const {queryAuthn, queryDownloads} = await init(deployer)
			const npmTest = await contracts('NpmMarketTest').new(
				queryAuthn.address,
				queryDownloads.address
			)
			const allocator = await contracts('Allocator').new(npmTest.address)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			await npmTest.setPackages('npm', metrics)

			const {0: _time, 1: _block} = await queryDownloads.getBaseTime()
			const ONE_MONTH = 86400 * 30
			const time = _time.toNumber()
			const block = _block.toNumber()
			const baseTime = time - ONE_MONTH
			const baseBlock = block + ONE_MONTH / 15
			const endBlock = baseBlock + ONE_MONTH / 15
			await queryDownloads.setBaseTime(baseTime, baseBlock)

			const start = await queryDownloads
				.timestamp(baseBlock)
				.then((x: BigNumber) => x.toNumber() * 1000)
			const end = await queryDownloads
				.timestamp(endBlock)
				.then((x: BigNumber) => x.toNumber() * 1000)

			await allocator.allocate(metrics, baseBlock, endBlock)
			const npm = await rp({
				uri: `https://api.npmjs.org/downloads/point/${format(
					start,
					'yyyy-MM-dd'
				)}:${format(end, 'yyyy-MM-dd')}/npm`,
				json: true
			})
			await waitForMutation(
				async () => (await allocator.lastMetricsAddress()) === metrics
			)
			expect(await allocator.lastMetricsAddress()).to.be.equal(metrics)
			expect(
				await allocator.lastMetricsValue().then((x: BigNumber) => x.toNumber())
			).to.be.equal(npm.downloads)
		})
		it('should fail to calculate when pass other than Metrics address')
	})
})
