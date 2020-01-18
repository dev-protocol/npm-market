import BigNumber from 'bignumber.js'
import {format} from 'date-fns'
import {get} from 'request-promise'
import {
	init,
	createNpmTest,
	setTimeTo,
	waitForEvent,
	launchEthereumBridge
} from './utils'
import {ChildProcess} from 'child_process'
const ws = 'ws://localhost:7545'

let bridge: ChildProcess

contract('NpmMarket', ([deployer, user]) => {
	before(async () => {
		bridge = await launchEthereumBridge()
	})
	after(() => {
		process.kill(bridge.pid)
	})
	describe('authenticate', () => {
		it('authenticate npm package and calling Market.authenticatedCallback', async () => {
			const {market, npm} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'

			await market.authenticate(
				property,
				':TEST_PACKAGE:',
				':TEST_TOKEN:',
				'',
				'',
				''
			)

			await waitForEvent(npm, ws)('Registered')

			expect(await market.lastProperty()).to.be.equal(property)
		})
		it('should fail to authenticate npm package when invalid token', async () => {
			const {market, npm} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'

			await market.authenticate(
				property,
				':TEST_PACKAGE:',
				'INCORRECT_TOKEN',
				'',
				'',
				''
			)

			await waitForEvent(npm, ws)('Authenticated')

			expect(await market.lastProperty()).to.be.not.equal(property)
		})
	})
	describe('calculate', () => {
		it('calculate downloads count of npm package during the passd period and calling Allocator.calculatedCallback', async () => {
			const {queryAuthn, queryDownloads} = await init(deployer)
			const {npm, allocator} = await createNpmTest(queryAuthn, queryDownloads)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			await npm.setPackages('npm', metrics)

			const time = await setTimeTo(86400 + 15, queryDownloads)
			await allocator.allocate(metrics, time.block.start, time.block.end)

			await waitForEvent(npm, ws)('Calculated')
			expect(await allocator.lastMetricsAddress()).to.be.equal(metrics)
			expect(
				await allocator.lastMetricsValue().then((x: BigNumber) => x.toNumber())
			).to.be.not.equal(0)
		})
		it('calculate target period by the passed two block-number', async () => {
			const {queryAuthn, queryDownloads} = await init(deployer)
			const {npm, allocator} = await createNpmTest(queryAuthn, queryDownloads)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			await npm.setPackages('npm', metrics)

			const time = await setTimeTo(86400 * 30, queryDownloads)

			await allocator.allocate(metrics, time.block.start, time.block.end)
			const api = await get({
				uri: `https://api.npmjs.org/downloads/point/${format(
					time.timestamp.start,
					'yyyy-MM-dd'
				)}:${format(time.timestamp.end, 'yyyy-MM-dd')}/npm`,
				json: true
			})
			await waitForEvent(npm, ws)('Calculated')
			expect(await allocator.lastMetricsAddress()).to.be.equal(metrics)
			expect(
				await allocator.lastMetricsValue().then((x: BigNumber) => x.toNumber())
			).to.be.equal(api.downloads)
		})
		it('should fail to calculate when the target period within 1 day', async () => {
			const {queryAuthn, queryDownloads} = await init(deployer)
			const {npm, allocator} = await createNpmTest(queryAuthn, queryDownloads)
			const metrics = '0x1D03CE5922e82763a9b57c63F801BD8082C32378'
			await npm.setPackages('npm', metrics)

			const time = await setTimeTo(86400, queryDownloads)
			const res = await allocator
				.allocate(metrics, time.block.start, time.block.end)
				.catch((err: Error) => err)

			expect(res).to.be.an.instanceOf(Error)
			expect((res as any).reason).to.be.equal(
				'cannot be re-calculate within 24 hours'
			)
		})
	})
	describe('migrate', () => {
		it('migratable is true by default', async () => {
			const {npm} = await init(deployer)
			const migratable = await npm.migratable()
			expect(migratable).to.be.equal(true)
		})
		it('migrate property by package specify', async () => {
			const {npm, market} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'
			const res = await npm.migrate(property, 'test', market.address)
			const metrics = res.logs.find(x => x.event === 'Registered')!.args
				._metrics
			const pkg = await npm.getPackage(metrics.toString())
			expect(pkg.toString()).to.be.equal('test')
		})
		it('should fail to migrate when sent from other than owner', async () => {
			const {npm, market} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'
			const res = await npm
				.migrate(property, 'test', market.address, {
					from: user
				})
				.catch((err: Error) => err)
			expect(res).to.be.an.instanceOf(Error)
		})
		it('set migratable to false', async () => {
			const {npm} = await init(deployer)
			expect(await npm.migratable()).to.be.equal(true)

			await npm.done()
			expect(await npm.migratable()).to.be.equal(false)
		})
		it('should fail to set migratable to false when sent from other than owner', async () => {
			const {npm} = await init(deployer)
			expect(await npm.migratable()).to.be.equal(true)

			const res = await npm.done({from: user}).catch((err: Error) => err)
			expect(res).to.be.an.instanceOf(Error)
		})
		it('should fail to migrate when migratable is false', async () => {
			const {npm, market} = await init(deployer)
			const property = '0x812788B0b58Cb16e7c2DD6Ead2ad2a52a1caFf6F'
			await npm.done()
			const res = await npm
				.migrate(property, 'Test', market.address)
				.catch((err: Error) => err)
			expect(res).to.be.an.instanceOf(Error)
		})
	})
})
