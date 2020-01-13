import {
	QueryNpmAuthenticationInstance,
	QueryNpmDownloadsInstance,
	NpmMarketInstance,
	MarketInstance,
	AllocatorInstance,
	NpmMarketTestInstance
} from '../types/truffle-contracts'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import {ChildProcess, spawn} from 'child_process'

const waitForStdOut = async (cp: ChildProcess, test: RegExp): Promise<void> =>
	new Promise(resolve => {
		const handler = (data: Buffer): void => {
			const output = data.toString()
			console.log(output)
			if (test.test(output)) {
				cp.stdout.off('data', handler)
				resolve()
			}
		}

		cp.stdout.on('data', handler)
	})
export const startEthereumBridge = async (): Promise<ChildProcess> => {
	const bridge = spawn('npx', [
		'ethereum-bridge',
		'-a',
		'9',
		'-H',
		'127.0.0.1',
		'-p',
		'7545',
		'--dev'
	])
	await waitForStdOut(bridge, /Ctrl\+C to exit/)
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
		watch(deployedContract, uri)(name, err => {
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
			value: '100000000000000000'
		}),
		queryDownloads.charge({
			from: deployer,
			value: '100000000000000000'
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
