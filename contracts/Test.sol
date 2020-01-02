pragma solidity ^0.5.0;

import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";
import {IMarket} from "@dev-protocol/protocol/contracts/src/market/IMarket.sol";

contract OraclizeTest {
	address payable public owner;
	event OraclizeQuery(string _f, string _a);

	constructor() public {
		owner = msg.sender;
	}

	function oraclize_getPrice() internal pure returns (uint256) {
		return 1;
	}
	function oraclize_query(string memory _f, string memory _a)
		internal
		returns (bytes32)
	{
		emit OraclizeQuery(_f, _a);
		return "query_id";
	}
	function oraclize_cbAddress() internal returns (address) {
		return owner;
	}
}

contract QueryNpmAuthenticationTest is OraclizeTest, QueryNpmAuthentication {}
contract QueryNpmDownloadsTest is OraclizeTest, QueryNpmDownloads {}

contract Market is IMarket {
	address public lastProperty;
	address public lastMetricsAddress;
	uint256 public lastMetricsValue;

	function authenticatedCallback(address _prop) public returns (address) {
		lastProperty = _prop;
		return _prop;
	}

	function calculatedCallback(address _metrics, uint256 _value) public {
		lastMetricsAddress = _metrics;
		lastMetricsValue = _value;
	}
}
