contract('NpmMarket', () => {
	describe('authenticate', () => {
		it('authenticate npm package and calling Market.authenticatedCallback')
		it('should fail to authenticate npm package when invalid read-only token')
	})
	describe('calculate', () => {
		it(
			'calculate downloads count of npm package during the passd period and calling Allocator.calculatedCallback'
		)
		it('should fail to calculate when pass other than Metrics address')
	})
})
