pragma solidity ^0.5.0;

import {Market} from "@dev-protocol/protocol/contracts/src/market/Market.sol";
import {
	Allocator
} from "@dev-protocol/protocol/contracts/src/allocator/Allocator.sol";
import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";
import {StringToUint} from "./lib/StringToUint.sol";

contract NpmMarket is Timebased, usingProvable {
	using StringToUint for string;
	using UintToString for uint256;
	string public schema = "['npm package', 'npm read-only token']";
	address public queryNpmAuthentication;
	address public queryNpmDownloads;

	mapping(address => string) internal packages;
	mapping(bytes32 => address) internal callbackMarket;
	mapping(bytes32 => address) internal callbackAllocator;
	mapping(bytes32 => string) internal pendingAuthentication;
	mapping(bytes32 => string) internal pendingAuthenticationPackage;
	mapping(bytes32 => string) internal pendingMetrics;

	constructor(address _queryNpmAuthentication, address _queryNpmDownloads)
		public
	{
		queryNpmAuthentication = _queryNpmAuthentication;
		queryNpmDownloads = _queryNpmDownloads;
	}

	function authenticate(
		address _prop,
		string calldata _npmPackage,
		string calldata _npmReadOnlyToken,
		string,
		string,
		string,
		address _dest
	) external returns (bool) {
		bytes32 id = QueryNpmAuthentication(queryNpmAuthentication).query(
			_npmPackage,
			_npmReadOnlyToken
		);
		pendingAuthentication[id] = _prop;
		pendingAuthenticationPackage[id] = _npmPackage;
		callbackMarket[id] = _dest;
		return true;
	}

	function authenticated(bytes32 _id, string memory _result) external {
		address property = pendingAuthentication[_id];
		uint8 result = _result.toUint();
		if (result == 0) {
			return;
		}
		address dest = callbackMarket[_id];
		delete pendingAuthentication[_id];
		delete callbackMarket[_id];
		address metrics = Market(dest).authenticatedCallback(property);
		packages[metrics] = pendingAuthenticationPackage[_id];
		delete pendingAuthenticationPackage[_id];
	}

	function calculate(address _metrics, uint256 _start, uint256 _end)
		external
		returns (bool)
	{
		string memory package = packages[_metrics];
		bytes32 id = QueryNpmDownloads(queryNpmDownloads).query(
			_start,
			_end,
			package
		);
		pendingMetrics[id] = metrics;
		callbackAllocator[id] = msg.sender;
		return true;
	}

	function calculated(bytes32 _id, string memory _result) external {
		address metrics = pendingMetrics[_id];
		uint256 count = _result.toUint();
		address dest = callbackAllocator[_id];
		delete pendingMetrics[_id];
		delete callbackAllocator[_id];
		Allocator(dest).calculatedCallback(metrics, count);
	}
}
