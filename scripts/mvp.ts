import {config} from 'dotenv'
import {migrateMvp} from './migrate-mvp'

config()

const handler = async function(
	callback: (
		err: Error | null,
		res?: ReturnType<typeof migrateMvp> extends Promise<infer T> ? T : never
	) => void
): Promise<void> {
	const {MARKET_ADDRESS, PROPERTY_FACTORY_ADDRESS} = process.env
	if (MARKET_ADDRESS === undefined || PROPERTY_FACTORY_ADDRESS === undefined) {
		return
	}

	const [npm, propertyFactory] = await Promise.all([
		artifacts.require('NpmMarket').deployed(),
		artifacts.require('PropertyFactory').at(PROPERTY_FACTORY_ADDRESS)
	])
	const res = await migrateMvp(npm, propertyFactory, MARKET_ADDRESS).catch(
		(err: Error) => err
	)

	if (res instanceof Error) {
		return callback(res)
	}

	callback(null, res)
}

export = handler
