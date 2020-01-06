export const waitForMutation = async (
	inspector: () => Promise<boolean>,
	interval = 100,
	timeout = 10000
): Promise<Error | void> =>
	new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error()), timeout)
		const f = async (): Promise<any> => {
			if (await inspector()) {
				return resolve()
			}

			await new Promise(res => setTimeout(res, interval))
			f()
		}

		f()
	})
