interface LsPackagesResults {
	readonly [key: string]: string
}

declare module 'libnpmaccess' {
	export function lsPackages(
		username: string,
		options: {token: string}
	): Promise<LsPackagesResults>
}
