pragma solidity ^0.5.0;

import "./module/provableAPI.sol";
import {StringToUint} from "./lib/StringToUint.sol";
import {NpmMarket} from "./NpmMarket.sol";

contract QueryNpmAuthentication is usingOraclize {
	using StringToUint for string;
	mapping(bytes32 => address) internal callbackDestinations;

	function query(string calldata _package, string calldata _readOnlyToken)
		external
		returns (bytes32)
	{
		require(
			oraclize_getPrice("URL") > address(this).balance,
			"Calculation query was NOT sent"
		);
		string memory url = string(
			abi.encodePacked(
				"https://dev-protocol-npm-market.now.sh/",
				_package,
				"/",
				_readOnlyToken
			)
		);
		bytes32 id = oraclize_query("URL", url);
		callbackDestinations[id] = msg.sender;
		return id;
	}

	// It is expected to be called by [Oraclize](https://docs.oraclize.it/#ethereum-quick-start).
	function __callback(bytes32 _id, string memory _result) public {
		if (msg.sender != oraclize_cbAddress()) {
			revert("mismatch oraclize_cbAddress");
		}
		address callback = callbackDestinations[_id];
		NpmMarket(callback).authenticated(_id, _result);
	}
}

contract QueryNpmAuthenticationTest is QueryNpmAuthentication {
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
	function oraclize_cbAddress() internal returns (address) {
		return owner;
	}
}
