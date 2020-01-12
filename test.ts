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
const waitForExit = async (cp: ChildProcess): Promise<void> =>
	new Promise((resolve, reject) => {
		const handler = (data: Buffer): void => console.log(data.toString())

		cp.stdout.on('data', handler)
		cp.on('exit', () => {
			cp.stdout.off('data', handler)
			resolve()
		})
		cp.on('error', () => {
			reject()
		})
	})
const kill = (cp: ChildProcess): void => process.kill(cp.pid)
;(async () => {
	// Launch ganache
	const ganache = spawn('npx', ['ganache-cli', '-p', '7545'])
	await waitForStdOut(ganache, /Listening on [0-9.:]*/)

	// Launch ethereum-bridge
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

	// Run tests
	const test = spawn('npx', ['truffle', 'test', '--network', 'ganache'])
	waitForStdOut(test, /[0-9]+ failing$/).then(() => {
		throw new Error('test is failed')
	})
	await waitForExit(test)
	kill(bridge)
	kill(ganache)
})()
