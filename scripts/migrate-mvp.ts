import {NpmMarketInstance, MetricsContract} from '../types/truffle-contracts'
import {all} from 'promise-parallel-throttle'
import Web3 from 'web3'
import {config} from 'dotenv'
import {open, close, get as getLog, addToWrite} from './log'
import {getAllMetrics} from './get-all-metrics'

type Result = {
	metrics?: string
	legacyMetrics?: string
	skip: boolean
}

type Results = Result[]

const txOps = (): Truffle.TransactionDetails => ({
	gasPrice: Web3.utils.toWei(
		config().parsed?.MIGRATION_GAS_PRISE ?? '2',
		'Gwei'
	),
})

export const migrateMvp = async (
	npm: NpmMarketInstance,
	metricsContract: MetricsContract,
	market: string
): Promise<Results> => {
	console.log('*** Start migration')

	const allMetrics = await getAllMetrics()

	const requests = allMetrics.data.metrics_factory_create.map(
		({metrics}) => async (): Promise<Result> => {
			const [property, pkg] = await Promise.all([
				Promise.all([metricsContract.at(metrics)]).then(async ([instance]) =>
					instance.property()
				),
				npm.getPackage(metrics),
			])
			if (!property && !pkg) {
				return {skip: false}
			}

			if (getLog(pkg)) {
				console.log(`${pkg} is already migrated`)
				return {skip: true}
			}

			const nextMetrics: string = await npm
				.migrate(property, pkg, market, txOps())
				.then((res) => {
					addToWrite(pkg, property)
					return (res.logs.find((x) => x.event === 'Registered')!.args as {
						[key: string]: string
					})._metrics
				})
				.catch((err: Error) => {
					console.log('error on creating new metrics by migration')
					console.error(err)
				})
			console.log('*** Metrics:', metrics)

			return {metrics: nextMetrics, legacyMetrics: metrics, skip: false}
		}
	)

	open()
	const results = await all(requests, {maxInProgress: 1})
	close()
	console.log(
		'*** Number of migration completed:',
		results.filter((x) => !x.skip && x.metrics).length
	)
	console.log(
		'*** Number of migration failed:',
		results.filter((x) => !x.skip && !x.metrics).length
	)

	return results
}
