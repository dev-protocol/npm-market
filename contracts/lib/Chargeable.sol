pragma solidity ^0.5.0;

contract Chargeable {
	uint256 internal _totalCharged;
	mapping(address => uint256) internal charged;

	constructor() public payable {
		charge();
	}

	function charge() public payable {
		charged[msg.sender] += msg.value;
		_totalCharged += msg.value;
	}

	function getCharged() public view returns (uint256) {
		return charged[msg.sender];
	}

	function totalCharged() public view returns (uint256) {
		return _totalCharged;
		// return address(this).balance;
	}

	function redeem() public {
		msg.sender.transfer(getCharged());
		delete charged[msg.sender];
	}
}
