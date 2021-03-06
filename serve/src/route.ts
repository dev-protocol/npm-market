import {send as _send} from 'micro'
import {parse} from 'url'
import {authenticate, Props} from './authenticate'
import {IncomingMessage, ServerResponse} from 'http'

const createSend = (
	res: ServerResponse
): ((body?: string | number) => Promise<void>) => async (
	body: string | number = 0
): Promise<void> => _send(res, 200, String(body))

export const route = (authenticateProps: Props) => async (
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

	const [, pkgOrOrg, orgOrToken, emptyOrToken] = pathname.split('/')
	const pkg = emptyOrToken ? `${pkgOrOrg}/${orgOrToken}` : pkgOrOrg
	const token = emptyOrToken ? emptyOrToken : orgOrToken
	if (pkg === ':TEST_PACKAGE:' && token === ':TEST_TOKEN:') {
		return send(1)
	}

	const result = await authenticate(pkg, token, authenticateProps)
	send(result ? 1 : 0)
}
