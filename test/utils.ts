import {
	QueryNpmAuthenticationInstance,
	QueryNpmDownloadsInstance,
	NpmMarketInstance,
	MarketInstance,
	AllocatorInstance
} from '../types/truffle-contracts'

export const waitForMutation = async (
	inspector: () => Promise<boolean>,
	interval = 100,
	timeout = 10000
): Promise<Error | void> =>
	new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error()), timeout)
		const f = async (): Promise<any> => {
			if (await inspector()) {
				return resolve()
			}

			await new Promise(res => setTimeout(res, interval))
			f()
		}

		f()
	})

const contracts = artifacts.require

export const init = async (
	deployer: string
): Promise<{
	queryAuthn: QueryNpmAuthenticationInstance
	queryDownloads: QueryNpmDownloadsInstance
	npm: NpmMarketInstance
	market: MarketInstance
	allocator: AllocatorInstance
}> => {
	const queryAuthn = await contracts('QueryNpmAuthentication').new()
	const queryDownloads = await contracts('QueryNpmDownloads').new()
	const npm = await contracts('NpmMarket').new(
		queryAuthn.address,
		queryDownloads.address
	)
	const market = await contracts('Market').new(npm.address)
	const allocator = await contracts('Allocator').new(npm.address)
	await Promise.all([
		queryAuthn.charge({
			from: deployer,
			value: '1000000000000000'
		}),
		queryDownloads.charge({
			from: deployer,
			value: '1000000000000000'
		})
	])
	return {queryAuthn, queryDownloads, npm, market, allocator}
}
