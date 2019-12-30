import {send as _send} from 'micro'
import {parse} from 'url'
import {authenticate} from './authenticate'
import {IncomingMessage, ServerResponse} from 'http'

const createSend = (
	res: ServerResponse
): ((body?: string | number) => Promise<void>) => async (
	body: string | number = 0
): Promise<void> => _send(res, 200, String(body))

export const route = async (
	req: IncomingMessage,
	res: ServerResponse
): Promise<void> => {
	const send = createSend(res)
	const {url} = req
	if (!url) {
		return send()
	}

	const {pathname} = parse(url)
	if (!pathname) {
		return send()
	}

	const [, pkg, token] = pathname.split('/')

	const result = await authenticate(pkg, token)
	send(result ? 1 : 0)
}
