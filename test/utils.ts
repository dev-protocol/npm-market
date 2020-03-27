/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
	QueryNpmAuthenticationInstance,
	QueryNpmDownloadsInstance,
	NpmMarketInstance,
	MarketInstance,
	AllocatorInstance,
	NpmMarketTestInstance,
} from '../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import {ChildProcess, spawn} from 'child_process'

export const launchEthereumBridge = async (): Promise<ChildProcess> => {
	const bridge = spawn('npx', [
		'ethereum-bridge',
		'-a',
		'9',
		'-H',
		'127.0.0.1',
		'-p',
		'7545',
		'--dev',
	])
	await new Promise((resolve) => {
		const handler = (data: Buffer): void => {
			console.log(data.toString())
			if (data.includes('Ctrl+C to exit')) {
				bridge.stdout.off('data', handler)
				resolve()
			}
		}

		bridge.stdout.on('data', handler)
	})
	return bridge
}

export const watch = (deployedContract: any, uri: string) => (
	name: string,
	handler: (err: Error, values: {[key: string]: string}) => void
): void => {
	const {contract: deployed} = deployedContract
	const web3WithWebsockets = new Web3(new Web3.providers.WebsocketProvider(uri))
	const {events} = new web3WithWebsockets.eth.Contract(
		deployed._jsonInterface,
		deployed._address
	)

	events.allEvents({fromBlock: 0, toBlock: 'latest'}, (err: Error, e: any) => {
		if (e.event === name) {
			handler(err, e.returnValues)
		}
	})
}

export const waitForEvent = (deployedContract: any, uri: string) => async (
	name: string,
	timeout = 10000
): Promise<Error | void> =>
	new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error()), timeout)
		watch(deployedContract, uri)(name, (err) => {
			if (err) {
				return reject(err)
			}

			resolve()
		})
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
			value: '100000000000000000',
		}),
		queryDownloads.charge({
			from: deployer,
			value: '100000000000000000',
		}),
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
	seconds: number,
	queryDownloads: QueryNpmDownloadsInstance
): Promise<{
	timestamp: {begin: number; end: number}
	block: {begin: number; end: number}
}> => {
	const {0: _time, 1: _block} = await queryDownloads.getBaseTime()
	const time = _time.toNumber()
	const block = _block.toNumber()
	const baseTime = time - seconds
	const baseBlock = ~~(block + seconds / 15)
	const endBlock = ~~(baseBlock + seconds / 15)
	await queryDownloads.setBaseTime(baseTime, baseBlock)

	const begin = await queryDownloads
		.timestamp(baseBlock)
		.then((x: BigNumber) => x.toNumber() * 1000)
	const end = await queryDownloads
		.timestamp(endBlock)
		.then((x: BigNumber) => x.toNumber() * 1000)

	return {
		timestamp: {
			begin,
			end,
		},
		block: {
			begin: baseBlock,
			end: endBlock,
		},
	}
}
