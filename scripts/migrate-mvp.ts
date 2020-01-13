import {get} from 'request-promise'
import {
	MarketInstance,
	NpmMarketInstance,
	PropertyFactoryInstance
} from '../types/truffle-contracts'
import {all} from 'promise-parallel-throttle'

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

const createContracts = async (
	addressMarket: string,
	addressNpm: string,
	addressPropertyFactory: string
): Promise<{
	market: MarketInstance
	npm: NpmMarketInstance
	propertyFactory: PropertyFactoryInstance
}> => {
	const [market, npm, propertyFactory] = await Promise.all([
		artifacts.require('Market').at(addressMarket),
		artifacts.require('NpmMarket').at(addressNpm),
		artifacts.require('PropertyFactory').at(addressPropertyFactory)
	])
	return {market, npm, propertyFactory}
}

const createPropertyName = (pkg: string): string =>
	pkg.replace(/^@.*\/(.*)/, '$1')

const createPropertySymbol = (pkg: string): string =>
	createPropertyName(pkg)
		.toUpperCase()
		.replace(/\W/g, '')

const random = (min: number, max: number): number => {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

const pickElements = (pkgs: Pkgs, count = 0): Pkgs =>
	(max =>
		count > 0
			? new Array(count)
					.fill('')
					.map(() => random(0, max))
					.map(i => pkgs[i])
			: pkgs)(pkgs.length - 1)

const handler = async (
	callback: (err: Error | null, res?: Results) => void
): Promise<void> => {
	const {
		MARKET_ADDRESS,
		NPM_MARKET_ADDRESS,
		PROPERTY_FACTORY_ADDRESS,
		PICK_TO_RANDOM = 0
	} = process.env
	if (
		MARKET_ADDRESS === undefined ||
		NPM_MARKET_ADDRESS === undefined ||
		PROPERTY_FACTORY_ADDRESS === undefined
	) {
		return callback(new Error('required options are not found'))
	}

	const {market, npm, propertyFactory} = await createContracts(
		MARKET_ADDRESS,
		NPM_MARKET_ADDRESS,
		PROPERTY_FACTORY_ADDRESS
	)
	const pkgs: Pkgs = await get({
		uri: 'https://dev-distribution.now.sh/config/packages',
		json: true
	})
	const count = PICK_TO_RANDOM ? Number(PICK_TO_RANDOM) : 0

	const requests = pickElements(pkgs, count).map(
		({package: pkg, address}) => async (): Promise<{
			property: string
			metrics: string
		}> => {
			const property: string = await propertyFactory
				.create(createPropertyName(pkg), createPropertySymbol(pkg), address)
				.then(res => res.logs.find(x => x.event === 'Create')!.args._property)
			const metrics: string = await npm
				.migrate(property, pkg, market.address)
				.then(
					res => res.logs.find(x => x.event === 'Registered')!.args._metrics
				)
			return {property, metrics}
		}
	)

	const results = await all(requests, {maxInProgress: 1})

	callback(null, results)
}

export = handler
