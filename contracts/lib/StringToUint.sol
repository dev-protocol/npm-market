pragma solidity ^0.5.0;

library StringToUint {
	function toUint(string memory _a, uint256 _b)
		internal
		pure
		returns (uint256 _parsedInt)
	{
		bytes memory bresult = bytes(_a);
		uint256 b = _b;
		uint256 mint = 0;
		bool decimals = false;
		for (uint256 i = 0; i < bresult.length; i++) {
			if (
				(uint256(uint8(bresult[i])) >= 48) &&
				(uint256(uint8(bresult[i])) <= 57)
			) {
				if (decimals) {
					if (b == 0) {
						break;
					} else {
						b--;
					}
				}
				mint *= 10;
				mint += uint256(uint8(bresult[i])) - 48;
			} else if (uint256(uint8(bresult[i])) == 46) {
				decimals = true;
			}
		}
		if (b > 0) {
			mint *= 10**b;
		}
		return mint;
	}
}
