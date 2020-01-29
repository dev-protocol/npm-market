import {config} from 'dotenv'
import {migrateMvp} from './migrate-mvp'
import {
	PropertyFactoryInstance,
	NpmMarketInstance,
	MarketFactoryInstance
} from '../types/truffle-contracts'
config()

const handler = function(deployer, network) {
	const {MARKET_FACTORY_ADDRESS, PROPERTY_FACTORY_ADDRESS} = process.env
	if (
		MARKET_FACTORY_ADDRESS === undefined ||
		PROPERTY_FACTORY_ADDRESS === undefined
	) {
		return console.log(`require envs is not found in ${network}`)
	}

	const npm = artifacts.require('NpmMarket')

	let propertyFactory: PropertyFactoryInstance
	let npmMarket: NpmMarketInstance
	;(deployer as any)
		.then(async () =>
			Promise.all([
				artifacts.require('MarketFactory').at(MARKET_FACTORY_ADDRESS),
				artifacts.require('PropertyFactory').at(PROPERTY_FACTORY_ADDRESS),
				artifacts.require('NpmMarket').deployed()
			])
		)
		.then(
			async ([_marketFactory, _propertyFactory, _npmMarket]: [
				MarketFactoryInstance,
				PropertyFactoryInstance,
				NpmMarketInstance
			]) => {
				propertyFactory = _propertyFactory
				npmMarket = _npmMarket
				return _marketFactory.create(npm.address)
			}
		)
		.then(async (res: Truffle.TransactionResponse) => {
			const market = res.logs.find(e => e.event === 'Create')!.args._market
			return migrateMvp(npmMarket, propertyFactory, market)
		})
		.then(() => {
			console.log('Migration is done')
		})
		.catch((err: Error) => console.error(err))
} as Truffle.Migration

export = handler
