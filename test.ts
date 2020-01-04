import {exec} from 'child_process'
;(async () => {
	const ganache = exec('npx ganache-cli -p 7545')
	await new Promise(resolve => {
		const handler = (data: string): void => {
			console.log(data)
			if (data.includes('Listening on 127.0.0.1:7545')) {
				ganache.stdout.off('data', handler)
				resolve()
			}
		}

		ganache.stdout.on('data', handler)
	})
	console.log('ganache is launched')
	const bridge = exec('npx ethereum-bridge -a 9 -H 127.0.0.1 -p 7545 --dev')
	await new Promise(resolve => {
		const handler = (data: string): void => {
			console.log(data)
			if (data.includes('Ctrl+C to exit')) {
				resolve()
			}
		}

		bridge.stdout.on('data', handler)
	})
	console.log('ethereum-bridge is launched')
	const test = exec('truffle test --network ganache')
	test.stdout.on('data', data => console.log(data))
})()
