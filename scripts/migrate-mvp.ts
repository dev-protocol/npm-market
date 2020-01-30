import {get} from 'request-promise'
import {
	NpmMarketInstance,
	PropertyFactoryInstance
} from '../types/truffle-contracts'
import {all} from 'promise-parallel-throttle'
import {open, close, get as getLog, addToWrite, remove} from './log'

type Pkgs = Array<{
	package: string
	address: string
	user: string
	date: string
}>

type Results = Array<{
	property: string
	metrics: string
	skip: boolean
}>

const ZERO = '0x0000000000000000000000000000000000000000'

const createPropertyName = (pkg: string): string =>
	pkg
		.replace(/^@.*\/(.*)/, '$1')
		.slice(0, 10)
		.padStart(3, 'x')

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

export const migrateMvp = async (
	npm: NpmMarketInstance,
	propertyFactory: PropertyFactoryInstance,
	market: string
): Promise<Results> => {
	console.log('*** Start migration')
	const {PICK_TO_RANDOM = 0} = process.env

	const pkgs: Pkgs = await get({
		uri: 'https://dev-distribution.now.sh/config/packages',
		json: true
	})
	const count = PICK_TO_RANDOM ? Number(PICK_TO_RANDOM) : 0
	console.log(`*** Migration targets:	${PICK_TO_RANDOM ? count : pkgs.length}`)

	const requests = pickElements(pkgs, count).map(
		({package: pkg, address}) => async (): Promise<{
			property: string
			metrics: string
			skip: boolean
		}> => {
			const metricsIsExists = await npm
				.getMetrics(pkg)
				.then(x => x.toString() !== ZERO)
			if (metricsIsExists) {
				console.log(`*** Skip: ${pkg}`)
				return {property: '', metrics: '', skip: true}
			}

			let _property = getLog(pkg)
			if (_property === undefined || _property === null) {
				_property = await propertyFactory
					.create(createPropertyName(pkg), createPropertySymbol(pkg), address)
					.then(res => res.logs.find(x => x.event === 'Create')!.args._property)
					.catch((err: Error) => {
						console.log('error on creating a new property')
						console.error(err)
					})
				console.log(`*** Property(created): ${_property!}`)
			} else {
				console.log(`*** Property(already created): ${_property}`)
			}

			const property = _property!

			const metrics: string = await npm
				.migrate(property, pkg, market)
				.then(res => {
					remove(pkg)
					return res.logs.find(x => x.event === 'Registered')!.args._metrics
				})
				.catch((err: Error) => {
					addToWrite(pkg, property)
					console.log('error on creating new metrics by migration')
					console.error(err)
				})
			console.log(`*** Metrics: ${metrics}`)

			return {property, metrics, skip: false}
		}
	)

	open()
	const results = await all(requests, {maxInProgress: 3})
	close()
	console.log(
		`*** Number of migration completed: ${
			results.filter(x => x.skip && x.metrics).length
		}`
	)
	console.log(
		`*** Number of migration failed: ${
			results.filter(x => x.skip === false && x.metrics === undefined).length
		}`
	)

	return results
}
