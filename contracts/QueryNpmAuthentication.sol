pragma solidity ^0.5.0;

import {NpmMarket} from "./NpmMarket.sol";
import {Chargeable} from "./lib/Chargeable.sol";
import {Queryable} from "./lib/Queryable.sol";


contract QueryNpmAuthentication is Queryable, Chargeable {
	mapping(bytes32 => address) internal callbackDestinations;

	function query(string calldata _package, string calldata _readOnlyToken)
		external
		returns (bytes32)
	{
		require(
			provable_getPrice("URL", queryGasLimit) < charged(),
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
		bytes32 id = provable_query("URL", url, queryGasLimit);
		callbackDestinations[id] = msg.sender;
		return id;
	}

	// It is expected to be called by [Oraclize](https://docs.oraclize.it/#ethereum-quick-start).
	function __callback(bytes32 _id, string memory _result) public {
		if (msg.sender != provable_cbAddress()) {
			revert("mismatch oraclize_cbAddress");
		}
		address callback = callbackDestinations[_id];
		uint256 result = parseInt(_result);
		NpmMarket(callback).authenticated(_id, result);
	}
}
