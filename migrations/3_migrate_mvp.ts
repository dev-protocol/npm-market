import {config} from 'dotenv'
import {migrateMvp} from './migrate-mvp'
import {
	PropertyFactoryInstance,
	NpmMarketInstance
} from '../types/truffle-contracts'
config()

const handler = function(deployer, network) {
	if (network === 'test') {
		return
	}

	const {MARKET_FACTORY_ADDRESS, PROPERTY_FACTORY_ADDRESS} = process.env
	if (
		MARKET_FACTORY_ADDRESS === undefined ||
		PROPERTY_FACTORY_ADDRESS === undefined
	) {
		return
	}

	const npm = artifacts.require('NpmMarket')

	let propertyFactory: PropertyFactoryInstance
	let npmMarket: NpmMarketInstance
	;((deployer as unknown) as Promise<void>)
		.then(async () =>
			Promise.all([
				artifacts.require('MarketFactory').at(MARKET_FACTORY_ADDRESS),
				artifacts.require('PropertyFactory').at(PROPERTY_FACTORY_ADDRESS),
				artifacts.require('NpmMarket').deployed()
			])
		)
		.then(async ([_marketFactory, _propertyFactory, _npmMarket]) => {
			propertyFactory = _propertyFactory
			npmMarket = _npmMarket
			return _marketFactory.create(npm.address)
		})
		.then(async res => {
			const market = res.logs.find(e => e.event === 'Create')!.args._market
			return migrateMvp(npmMarket, propertyFactory, market)
		})
		.then(() => {
			console.log('Migration is done')
		})
		.catch((err: Error) => console.error(err))
} as Truffle.Migration

export = handler
