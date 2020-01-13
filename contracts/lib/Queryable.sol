pragma solidity ^0.5.0;

import {usingProvable} from "../module/provableAPI.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";

contract Queryable is usingProvable, Ownable {
	uint32 public queryGasLimit = 700000;

	function setQueryGasLimit(uint32 _gasLimit) public onlyOwner {
		queryGasLimit = _gasLimit;
	}
}
