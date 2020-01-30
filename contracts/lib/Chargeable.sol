pragma solidity ^0.5.0;


contract Chargeable {
	function charge() public payable {}

	function charged() public view returns (uint256) {
		return address(this).balance;
	}
}
