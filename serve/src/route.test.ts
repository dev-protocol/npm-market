import test from 'ava'
import micro from 'micro'
import {get as _get, Response} from 'request'
import listen = require('test-listen')
import {spy} from 'sinon'
import * as authenticate from './authenticate'
import {route} from './route'
import {dummy} from './authenticate.test'

interface Res<T> extends Response {
	body: T
}

const get = async <T>(url: string): Promise<Res<T>> =>
	new Promise<Res<T>>((resolve, reject) => {
		_get(
			{
				url,
			},
			(err: null | Error, res: Res<T>) => {
				if (err) {
					reject(err)
					return
				}

				resolve(res)
			}
		)
	})

const createUrl = async (): Promise<string> => {
	const stub = dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
	const server = micro(route(stub))
	const url = await listen(server)
	return url
}

test.serial(
	'returns status code is 200 and the body is 1 when the result of `authenticate` is true',
	async (t) => {
		const CORRECT_TOKEN = Math.random().toString()
		const stub = dummy('CORRECT_PACKAGE', CORRECT_TOKEN)
		const auth = spy(authenticate, 'authenticate')
		const server = micro(route(stub))
		const url = await listen(server)
		const res = await get(`${url}/CORRECT_PACKAGE/${CORRECT_TOKEN}`)
		t.is(res.statusCode, 200)
		t.is(res.body, '1')
		t.true(await auth.getCall(0).returnValue)
		auth.restore()
	}
)

test.serial(
	'returns status code is 200 and the body is 0 when the result of `authenticate` is false',
	async (t) => {
		const CORRECT_TOKEN = Math.random().toString()
		const stub = dummy('CORRECT_PACKAGE', CORRECT_TOKEN)
		const auth = spy(authenticate, 'authenticate')
		const server = micro(route(stub))
		const url = await listen(server)
		const res = await get(`${url}/INCORRECT_PACKAGE/INCORRECT_TOKEN`)
		t.is(res.statusCode, 200)
		t.is(res.body, '0')
		t.false(await auth.getCall(0).returnValue)
		auth.restore()
	}
)

test('returns status code is 200 and the body is 1 when the request path is `/:TEST_PACKAGE:/:TEST_TOKEN:`', async (t) => {
	const url = await createUrl()
	const res = await get(`${url}/:TEST_PACKAGE:/:TEST_TOKEN:`)
	t.is(res.statusCode, 200)
	t.is(res.body, '1')
})

test('returns status code is 200 and the body is 0 when no pathname', async (t) => {
	const url = await createUrl()
	const res = await get(`${url}`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})

test('returns status code is 200 and the body is 0 when no first path', async (t) => {
	const url = await createUrl()
	const res = await get(`${url}/`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})

test('returns status code is 200 and the body is 0 when no second path', async (t) => {
	const url = await createUrl()
	const res = await get(`${url}/CORRECT_PACKAGE`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})
