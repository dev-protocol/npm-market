import test from 'ava'
import {config} from 'dotenv'
import {authenticate} from './authenticate'

config()
const {TEST_NPM_PACKAGE, TEST_NPM_TOKEN} = process.env

test('returns true when correct set of npm package name and npm read-only token', async t => {
	const res = await authenticate(TEST_NPM_PACKAGE!, TEST_NPM_TOKEN!)
	t.is(res, true)
})

test('returns false when incorrect npm package name', async t => {
	const res = await authenticate('x_x_;-', TEST_NPM_TOKEN!)
	t.is(res, false)
})

test('returns false when incorrect npm read-only token', async t => {
	const res = await authenticate(TEST_NPM_PACKAGE!, 'dummy')
	t.is(res, false)
})
