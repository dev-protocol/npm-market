import {resolve} from 'path'
import {readFileSync, writeFileSync} from 'fs'

type Log = Map<string, string>

const location = resolve(__dirname, '.log')

let IN_MEMORY: Log

const readFile = (): string => {
	try {
		return readFileSync(location).toString()
	} catch (err) {
		console.error(err)
		return ''
	}
}

const read = (): Log => new Map(JSON.parse(readFile() || '[]'))
const write = (log: Log): void =>
	writeFileSync(location, JSON.stringify(Array.from(log.entries())))

export const open = (): void => {
	IN_MEMORY = read()
}

export const close = (): void => {
	write(IN_MEMORY)
}

export const get = (key: string): string | undefined => IN_MEMORY.get(key)

export const add = (key: string, value: string): void => {
	IN_MEMORY.set(key, value)
}
