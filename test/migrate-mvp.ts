/* eslint-disable max-nested-callbacks */
import {get} from 'request-promise'
import {init} from './utils'
import {migrateMvp} from '../scripts/migrate-mvp'
import {
	PropertyInstance,
	NpmMarketInstance,
	MetricsInstance,
	PropertyFactoryInstance
} from '../types/truffle-contracts'

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

const createMetrics = async (address: string): Promise<MetricsInstance> =>
	artifacts.require('Metrics').at(address)
const createProperty = async (address: string): Promise<PropertyInstance> =>
	artifacts.require('Property').at(address)

contract('Migrate MVP', ([deployer]) => {
	describe('migration', () => {
		let marketAddress: string
		let npmMarket: NpmMarketInstance
		let propertyFactory: PropertyFactoryInstance
		before(async () => {
			const {market, npm} = await init(deployer)
			propertyFactory = await artifacts.require('PropertyFactory').new()
			marketAddress = market.address
			npmMarket = npm
		})

		it('migration all packages', async function() {
			this.timeout(3600000)
			const pkgs: Pkgs = await get({
				uri: 'https://dev-distribution.now.sh/config/packages',
				json: true
			})
			process.env.PICK_TO_RANDOM = '100'

			const res = await migrateMvp(npmMarket, propertyFactory, marketAddress)
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
					expect(name).to.be.match(/^[a-z0-9-.]*$/)
					expect(symbol).to.be.match(/^[A-Z0-9]*$/)
				})
			)
		})
	})
})
