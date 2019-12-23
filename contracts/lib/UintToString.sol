pragma solidity ^0.5.0;

library UintToString {
	function toString(uint256 _i)
		internal
		pure
		returns (string memory _string)
	{
		uint256 i = _i;
		if (i == 0) {
			return "0";
		}
		uint256 j = i;
		uint256 len;
		while (j != 0) {
			len++;
			j /= 10;
		}
		bytes memory bstr = new bytes(len);
		uint256 k = len - 1;
		while (i != 0) {
			bstr[k--] = bytes1(uint8(48 + (i % 10)));
			i /= 10;
		}
		return string(bstr);
	}
}
