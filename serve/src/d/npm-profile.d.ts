interface NpmProfileResults {
	readonly [key: string]: string
	readonly name: string
}

declare module 'npm-profile' {
	export function get(options: {token: string}): Promise<NpmProfileResults>
	export function removeToken(
		token: string,
		options: {token: string}
	): Promise<null>
}
