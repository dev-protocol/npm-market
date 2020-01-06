import {
	QueryNpmAuthenticationInstance,
	QueryNpmDownloadsInstance,
	NpmMarketInstance,
	MarketInstance,
	AllocatorInstance,
	NpmMarketTestInstance
} from '../types/truffle-contracts'
import BigNumber from 'bignumber.js'

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

export const createNpmTest = async (
	queryAuthn: QueryNpmAuthenticationInstance,
	queryDownloads: QueryNpmDownloadsInstance
): Promise<{
	npm: NpmMarketTestInstance
	allocator: AllocatorInstance
}> => {
	const npm = await contracts('NpmMarketTest').new(
		queryAuthn.address,
		queryDownloads.address
	)
	const allocator = await contracts('Allocator').new(npm.address)
	return {npm, allocator}
}

export const setTimeTo = async (
	month: number,
	queryDownloads: QueryNpmDownloadsInstance
): Promise<{
	timestamp: {start: number; end: number}
	block: {start: number; end: number}
}> => {
	const {0: _time, 1: _block} = await queryDownloads.getBaseTime()
	const MONTH = 86400 * 30 * month
	const time = _time.toNumber()
	const block = _block.toNumber()
	const baseTime = time - MONTH
	const baseBlock = block + MONTH / 15
	const endBlock = baseBlock + MONTH / 15
	await queryDownloads.setBaseTime(baseTime, baseBlock)

	const start = await queryDownloads
		.timestamp(baseBlock)
		.then((x: BigNumber) => x.toNumber() * 1000)
	const end = await queryDownloads
		.timestamp(endBlock)
		.then((x: BigNumber) => x.toNumber() * 1000)

	return {
		timestamp: {
			start,
			end
		},
		block: {
			start: baseBlock,
			end: endBlock
		}
	}
}
