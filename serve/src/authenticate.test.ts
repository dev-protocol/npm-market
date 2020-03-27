import test from 'ava'
import {authenticate, Props} from './authenticate'

export const dummy = (correctPackage: string, correctToken: string): Props => ({
	profile: {
		get: async ({token}): Promise<NpmProfileResults> => {
			if (token === correctToken) {
				return {name: 'CORRECT_USER'}
			}

			throw new Error()
		},
	},
	access: {
		lsPackages: async (username: string, options: {token: string}) => {
			if (username === 'CORRECT_USER' && options.token === correctToken) {
				return {
					[correctPackage]: 'test',
				}
			}

			throw new Error()
		},
	},
})

test('returns true when correct set of npm package name and npm read-only token', async (t) => {
	const CORRECT_TOKEN = Math.random().toString()
	const res = await authenticate(
		'CORRECT_PACKAGE',
		CORRECT_TOKEN,
		dummy('CORRECT_PACKAGE', CORRECT_TOKEN)
	)
	t.true(res)
})

test('returns false when incorrect npm package name', async (t) => {
	const CORRECT_TOKEN = Math.random().toString()
	const res = await authenticate(
		'x_x_;-',
		CORRECT_TOKEN,
		dummy('CORRECT_PACKAGE', CORRECT_TOKEN)
	)
	t.false(res)
})

test('returns false when incorrect npm read-only token', async (t) => {
	const res = await authenticate(
		'CORRECT_PACKAGE',
		'INCORRECT_TOKEN',
		dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	)
	t.false(res)
})

test('returns false when npm read-only token that already used', async (t) => {
	const CORRECT_TOKEN = Math.random().toString()
	await authenticate(
		'CORRECT_PACKAGE_1',
		CORRECT_TOKEN,
		dummy('CORRECT_PACKAGE_1', CORRECT_TOKEN)
	)
	const res = await authenticate(
		'CORRECT_PACKAGE_2',
		CORRECT_TOKEN,
		dummy('CORRECT_PACKAGE_2', CORRECT_TOKEN)
	)
	t.false(res)
})
