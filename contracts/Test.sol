pragma solidity ^0.5.0;

import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";

contract OraclizeTest {
	address public owner;
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
	function oraclize_cbAddress() internal view returns (address) {
		return owner;
	}
}

contract QueryNpmAuthenticationTest is OraclizeTest, QueryNpmAuthentication {}
contract QueryNpmDownloadsTest is OraclizeTest, QueryNpmDownloads {}
