import {ChildProcess, spawn} from 'child_process'

const waitForStdOut = async (cp: ChildProcess, txt: string): Promise<void> =>
	new Promise(resolve => {
		const handler = (data: Buffer): void => {
			console.log(data.toString())
			if (data.includes(txt)) {
				cp.stdout.off('data', handler)
				resolve()
			}
		}

		cp.stdout.on('data', handler)
	})
const kill = (cp: ChildProcess): void => process.kill(cp.pid)
;(async () => {
	const ganache = spawn('npx', ['ganache-cli', '-p', '7545'])
	await waitForStdOut(ganache, 'Listening on 127.0.0.1:7545')

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
	await waitForStdOut(bridge, 'Ctrl+C to exit')

	const test = spawn('npx', ['truffle', 'test', '--network', 'ganache'])
	const handler = (data: Buffer): void => console.log(data.toString())
	test.stdout.on('data', handler)
	test.on('exit', () => {
		kill(bridge)
		kill(ganache)
		test.stdout.off('data', handler)
	})
})()
