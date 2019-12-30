import {createError as error} from 'micro'
import {parse} from 'url'
import {NowRequest, NowResponse} from '@now/node'
import {authenticate} from './authenticate'

export const route = async (
	req: NowRequest,
	res: NowResponse
): Promise<void> => {
	const {url} = req
	if (!url) {
		throw error(404, 'resource not found')
	}

	const {pathname} = parse(url)
	if (!pathname) {
		throw error(404, 'resource not found')
	}

	const [, pkg, token] = pathname.split('/')

	const result = await authenticate(pkg, token)
	res.send(result ? 1 : 0)
}
