import * as profile from 'npm-profile'
import * as access from 'libnpmaccess'

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
	const user = await profile.get({token}).catch(err)
	if (user instanceof Error) {
		return false
	}

	const {name} = user

	const pkgs = await access.lsPackages(name, {token}).catch(err)
	if (pkgs instanceof Error) {
		return false
	}

	await profile.removeToken(token, {token}).catch(err)

	return pkg in pkgs
}
