export const waitForMutation = async (
	inspector: () => Promise<boolean>,
	interval = 100
): Promise<void> =>
	new Promise(resolve => {
		const f = async (): Promise<any> => {
			if (await inspector()) {
				return resolve()
			}

			await new Promise(res => setTimeout(res, interval))
			f()
		}

		f()
	})
