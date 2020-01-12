import {get} from 'request-promise'
import {init, watch} from './utils'
import migrate from '../scripts/migrate-mvp'
import {
	MetricsTestInstance,
	PropertyInstance,
	NpmMarketInstance
} from '../types/truffle-contracts'
const ws = 'ws://localhost:7545'

type Pkgs = Array<{
	package: string
	address: string
	user: string
	date: string
}>

type Results = Array<{
	property: string
	metrics: string
}>

const createMetrics = async (address: string): Promise<MetricsTestInstance> =>
	artifacts.require('MetricsTest').at(address)
const createProperty = async (address: string): Promise<PropertyInstance> =>
	artifacts.require('Property').at(address)

contract('Migrate MVP', ([deployer]) => {
	describe('migration', () => {
		let npmMarket: NpmMarketInstance
		let marketAddress: string
		let npmAddress: string
		let propertyFactoryAddress: string
		before(async () => {
			const {market, npm} = await init(deployer)
			const propertyFactory = await artifacts.require('PropertyFactory').new()
			npmMarket = npm
			marketAddress = market.address
			npmAddress = npm.address
			propertyFactoryAddress = propertyFactory.address
			watch(npm, ws)('Registered', (_, values) =>
				console.log(`New metrics contract: ${values._metrics}`)
			)
			watch(propertyFactory, ws)('Create', (_, values) =>
				console.log(`New property contract: ${values._property}`)
			)
		})

		it('migration all packages', async function() {
			this.timeout(3600000)
			const pkgs: Pkgs = await get({
				uri: 'https://dev-distribution.now.sh/config/packages',
				json: true
			})
			process.env.MARKET_ADDRESS = marketAddress
			process.env.NPM_MARKET_ADDRESS = npmAddress
			process.env.PROPERTY_FACTORY_ADDRESS = propertyFactoryAddress
			process.env.PICK_TO_RANDOM = '100'

			const res = await new Promise<Results>((resolve, reject) => {
				migrate((err: Error | null, res): void => {
					if (err) {
						return reject(err)
					}

					resolve(res)
				})
			})
			console.log('migration is done')

			await Promise.all(
				res.map(async ({metrics, property}) => {
					const [metricsContract, propertyContract] = await Promise.all([
						createMetrics(metrics),
						createProperty(property)
					])
					const [
						related2Metrics,
						pkgName,
						author,
						name,
						symbol
					] = await Promise.all([
						metricsContract.property(),
						npmMarket.getPackage(metrics),
						propertyContract.author(),
						propertyContract.name(),
						propertyContract.symbol()
					])
					const pkg = pkgs.find(x => x.package === pkgName)
					expect(pkg).to.be.not.equal(undefined)
					expect(related2Metrics.toLocaleLowerCase()).to.be.equal(
						property.toLocaleLowerCase()
					)
					expect(author.toLocaleLowerCase()).to.be.equal(
						pkg!.address.toLocaleLowerCase()
					)
					expect(name).to.be.match(/^[a-z0-9-]*$/)
					expect(symbol).to.be.match(/^[A-Z0-9]*$/)
				})
			)
		})
	})
})
