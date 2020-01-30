pragma solidity ^0.5.0;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";


contract Timebased is Ownable {
	using SafeMath for uint256;
	struct BaseTime {
		uint256 timestamp;
		uint256 blockHeight;
	}
	BaseTime internal baseTime;
	uint256 internal secondsPerBlock = 15;

	constructor() public {
		// solium-disable-next-line security/no-block-members
		baseTime = BaseTime(now, block.number);
	}

	function setSecondsPerBlock(uint256 _sec) public onlyOwner {
		secondsPerBlock = _sec;
	}

	function timestamp(uint256 _blockNumber) public view returns (uint256) {
		uint256 diff = _blockNumber.sub(baseTime.blockHeight);
		uint256 sec = diff.mul(secondsPerBlock);
		return baseTime.timestamp.add(sec);
	}

	function getBaseTime()
		public
		view
		returns (uint256 _timestamp, uint256 _blockHeight)
	{
		return (baseTime.timestamp, baseTime.blockHeight);
	}

	function setBaseTime(uint256 __timestamp, uint256 __blockHeight)
		public
		onlyOwner
		returns (uint256 _timestamp, uint256 _blockHeight)
	{
		baseTime = BaseTime(__timestamp, __blockHeight);
		return (baseTime.timestamp, baseTime.blockHeight);
	}
}
