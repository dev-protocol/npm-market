interface NpmProfileResults {
	readonly name: string
	readonly [key: string]: string
}

declare module 'npm-profile' {
	export function get(options: {token: string}): Promise<NpmProfileResults>
	export function removeToken(
		token: string,
		options: {token: string}
	): Promise<null>
}
