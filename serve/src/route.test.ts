import test from 'ava'
import micro from 'micro'
import {get as _get, Response} from 'request'
import {config} from 'dotenv'
import listen = require('test-listen')
import {authenticate} from './authenticate'
import {route} from './route'

config()
const {TEST_NPM_PACKAGE, TEST_NPM_TOKEN} = process.env

let url: string
const server = micro(route)

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
	const res = await get(`${url}/${TEST_NPM_PACKAGE}/${TEST_NPM_TOKEN}`)
	const authentication = await authenticate(TEST_NPM_PACKAGE!, TEST_NPM_TOKEN!)
	t.is(res.statusCode, 200)
	t.is(authentication, true)
	t.is(res.body, '1')
})

test('returns status code is 200 and the body is 0 when the result of `authenticate` is false', async t => {
	const res = await get(`${url}/x/x`)
	const authentication = await authenticate('x', 'x')
	t.is(res.statusCode, 200)
	t.is(authentication, false)
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
	const res = await get(`${url}/x/`)
	t.is(res.statusCode, 200)
	t.is(res.body, '0')
})
