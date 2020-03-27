import {config} from 'dotenv'
import {migrateMvp} from './migrate-mvp'

config()

const handler = async function(
	callback: (
		err: Error | null,
		res?: ReturnType<typeof migrateMvp> extends Promise<infer T> ? T : never
	) => void
): Promise<void> {
	const {MARKET_ADDRESS, NPM_MARKET_ADDRESS} = process.env
	if (MARKET_ADDRESS === undefined || NPM_MARKET_ADDRESS === undefined) {
		return
	}

	const [npm] = await Promise.all([
		artifacts.require('NpmMarket').at(NPM_MARKET_ADDRESS)
	])
	const res = await migrateMvp(
		npm,
		artifacts.require('Metrics'),
		MARKET_ADDRESS
	).catch((err: Error) => err)

	if (res instanceof Error) {
		return callback(res)
	}

	callback(null, res)
}

export = handler
