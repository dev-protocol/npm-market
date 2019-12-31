import test from 'ava'
import micro from 'micro'
import {get as _get, Response} from 'request'
import listen = require('test-listen')
import {authenticate} from './authenticate'
import {route} from './route'
import {dummy} from './authenticate.test'

let url: string
const stub = dummy('CORRECT_PACKAGE', 'CORRECT_TOKEN')
const server = micro(route(stub))

interface Res<T> extends Response {
	body: T
}

const get = async <T>(url: string): Promise<Res<T>> =>
	new Promise<Res<T>>((resolve, reject) => {
		_get(
			{
				url
			},
			(err, res) => {
				if (err) {
					reject(err)
					return
				}

				resolve(res as Res<T>)
			}
		)
	})

test.before(async () => {
	url = await listen(server)
})

test('returns status code is 200 and the body is 1 when the result of `authenticate` is true', async t => {
	const res = await get(`${url}/CORRECT_PACKAGE/CORRECT_TOKEN`)
	const authentication = await authenticate(
		'CORRECT_PACKAGE',
		'CORRECT_TOKEN',
		stub
	)
	t.is(res.statusCode, 200)
	t.true(authentication)
	t.is(res.body, '1')
})

test('returns status code is 200 and the body is 0 when the result of `authenticate` is false', async t => {
	const res = await get(`${url}/INCORRECT_PACKAGE/INCORRECT_TOKEN`)
	const authentication = await authenticate(
		'INCORRECT_PACKAGE',
		'INCORRECT_TOKEN',
		stub
	)
	t.is(res.statusCode, 200)
	t.false(authentication)
	t.is(res.body, '0')
})

test('returns status code is 200 and the body is 0 when no pathname', async t => {
	const res = await get(`${url}`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})

test('returns status code is 200 and the body is 0 when no first path', async t => {
	const res = await get(`${url}/`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})

test('returns status code is 200 and the body is 0 when no second path', async t => {
	const res = await get(`${url}/CORRECT_PACKAGE`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})
