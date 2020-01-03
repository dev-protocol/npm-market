pragma solidity ^0.5.0;

contract Chargeable {
	uint256 public totalCharged;
	mapping(address => uint256) internal charged;

	function charge() public payable {
		charged[msg.sender] += msg.value;
		totalCharged += msg.value;
	}

	function getCharged() public view returns (uint256) {
		return charged[msg.sender];
	}

	function redeem() public {
		uint256 amount = getCharged();
		totalCharged -= amount;
		msg.sender.transfer(amount);
		delete charged[msg.sender];
	}
}
