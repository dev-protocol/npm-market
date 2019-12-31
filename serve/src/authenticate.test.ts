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
		removeToken: async (token: string, options: {token: string}) => {
			if (token === correctToken && options.token === correctToken) {
				return null
			}

			throw new Error()
		}
	},
	access: {
		lsPackages: async (username: string, options: {token: string}) => {
			if (username === 'CORRECT_USER' && options.token === correctToken) {
				return {
					[correctPackage]: 'test'
				}
			}

			throw new Error()
		}
	}
})

test('returns true when correct set of npm package name and npm read-only token', async t => {
	const res = await authenticate(
		'CORRECT_PACKAGE',
		'CORRECT_TOKEN',
		dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	)
	t.true(res)
})

test('returns false when incorrect npm package name', async t => {
	const res = await authenticate(
		'x_x_;-',
		'CORRECT_TOKEN',
		dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	)
	t.false(res)
})

test('returns false when incorrect npm read-only token', async t => {
	const res = await authenticate(
		'CORRECT_PACKAGE',
		'INCORRECT_TOKEN',
		dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	)
	t.false(res)
})

test('finally, try to delete the token', async t => {
	t.plan(2)
	const stub = dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	stub.profile.removeToken = async () => {
		t.pass()
		return null
	}

	const res = await authenticate('CORRECT_PACKAGE', 'CORRECT_TOKEN', stub)
	t.true(res)
})
