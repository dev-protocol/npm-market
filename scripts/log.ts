import {resolve} from 'path'
import {readFileSync, writeFileSync} from 'fs'

type Value = string | null | undefined
type Log = Map<string, Value>

const location = resolve(__dirname, '.log')

let IN_MEMORY: Log

const readFile = (): string => {
	try {
		return readFileSync(location).toString()
	} catch (err) {
		console.error(err as Error)
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
	IN_MEMORY.clear()
}

export const get = (key: string): Value => IN_MEMORY.get(key)

export const add = (key: string, value: Value): void => {
	IN_MEMORY.set(key, value)
}

export const remove = (key: string): void => {
	IN_MEMORY.delete(key)
}

export const removeToWrite = (key: string): void => {
	remove(key)
	write(IN_MEMORY)
}

export const addToWrite = (key: string, value: Value): void => {
	add(key, value)
	write(IN_MEMORY)
}
