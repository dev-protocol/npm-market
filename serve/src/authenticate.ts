import {lsPackages} from 'libnpmaccess'
import {get} from 'npm-profile'

const prof = async (token: string): Promise<NpmProfileResults | Error> =>
	get({token}).catch((err: Error) => err)
const ls = async (
	username: string,
	token: string
): Promise<LsPackagesResults | Error> =>
	lsPackages(username, {token}).catch((err: Error) => err)

export const authenticate = async (
	pkg: string,
	token: string
): Promise<boolean> => {
	const user = await prof(token)
	if (user instanceof Error) {
		return false
	}

	const pkgs = await ls(user.name, token)
	if (pkgs instanceof Error) {
		return false
	}

	return pkg in pkgs
}
