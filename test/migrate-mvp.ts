import {migrateMvp} from '../scripts/migrate-mvp'
import {NpmMarketInstance, MetricsContract} from '../types/truffle-contracts'

const MockNpmMarket = ({
	getPackage(metrics: string): string {
		return `package-${metrics}`
	},

	async migrate(
		x: string,
		y: string,
		z: string
	): Promise<Truffle.TransactionResponse> {
		return Promise.resolve({
			logs: [{event: 'Registered', args: {_metrics: `${x}-${y}-${z}`}}]
		} as Truffle.TransactionResponse)
	}
} as unknown) as NpmMarketInstance

const MockMetricsContract = ({
	async at(
		x: string
	): Promise<{
		property: () => Promise<string>
	}> {
		return {
			async property(): Promise<string> {
				return `property-${x}`
			}
		}
	}
} as unknown) as MetricsContract

contract('Migrate MVP', () => {
	describe('migration', () => {
		it('migration all packages', async function() {
			this.timeout(3600000)

			const DUMMY_MARKET = '0xFD1407983EEaA0bf89b884E566C99A0DEb742e77'
			const res = await migrateMvp(
				MockNpmMarket,
				MockMetricsContract,
				DUMMY_MARKET
			)
			console.log('migration is done')

			await Promise.all(
				res.map(async ({metrics, legacyMetrics, skip}) => {
					if (skip) {
						return
					}

					expect(metrics).to.be.equal(
						`property-${legacyMetrics!}-package-${legacyMetrics!}-${DUMMY_MARKET}`
					)
				})
			)
		})
	})
})
