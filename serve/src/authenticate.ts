import * as profile from 'npm-profile'
import * as access from 'libnpmaccess'
import {get, Response} from 'request'
import {promisify} from 'util'

export interface Props {
	profile: typeof profile
	access: typeof access
}

const err = <T extends Error>(error: T): T => error

export const authenticate = async (
	pkg: string,
	token: string,
	{profile, access}: Props
): Promise<boolean> => {
	const used: Response | Error = await promisify(get)({
		uri: `https://d2hs0kgqnsy21g.cloudfront.net/${token}`
	}).catch(err)
	if (used instanceof Error) {
		return false
	}

	if (used.statusCode !== 200) {
		return false
	}

	const user = await profile.get({token}).catch(err)
	if (user instanceof Error) {
		return false
	}

	const {name} = user

	const pkgs = await access.lsPackages(name, {token}).catch(err)
	if (pkgs instanceof Error) {
		return false
	}

	return pkg in pkgs
}
