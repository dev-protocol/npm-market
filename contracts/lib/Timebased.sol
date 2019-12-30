pragma solidity ^0.5.0;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

contract Timebased {
	using SafeMath for uint256;
	struct BaseTime {
		uint256 time;
		uint256 blockHeight;
	}
	BaseTime internal baseTime;
	uint256 internal secondsPerBlock = 15;

	constructor() public {
		// solium-disable-next-line security/no-block-members
		baseTime = BaseTime(now, block.number);
	}

	function _setSecondsPerBlock(uint256 _sec) internal {
		secondsPerBlock = _sec;
	}

	function timestamp(uint256 _blockNumber) internal view returns (uint256) {
		uint256 diff = _blockNumber - baseTime.blockHeight;
		uint256 sec = diff.div(secondsPerBlock);
		return baseTime.time.add(sec);
	}
}
