pragma solidity ^0.5.0;

import {IMarket} from "@dev-protocol/protocol/contracts/src/market/IMarket.sol";
// prettier-ignore
import {IAllocator} from "@dev-protocol/protocol/contracts/src/allocator/IAllocator.sol";
import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";

contract NpmMarket {
	string public schema = "['npm package', 'npm read-only token']";
	address public queryNpmAuthentication;
	address public queryNpmDownloads;

	mapping(address => string) internal packages;
	mapping(bytes32 => address) internal callbackMarket;
	mapping(bytes32 => address) internal callbackAllocator;
	mapping(bytes32 => address) internal pendingAuthentication;
	mapping(bytes32 => string) internal pendingAuthenticationPackage;
	mapping(bytes32 => address) internal pendingMetrics;

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
		string calldata,
		string calldata,
		string calldata,
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

	function authenticated(bytes32 _id, uint256 _result) external {
		address property = pendingAuthentication[_id];
		if (_result == 0) {
			return;
		}
		address dest = callbackMarket[_id];
		delete pendingAuthentication[_id];
		delete callbackMarket[_id];
		address metrics = IMarket(dest).authenticatedCallback(property);
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
		pendingMetrics[id] = _metrics;
		callbackAllocator[id] = msg.sender;
		return true;
	}

	function calculated(bytes32 _id, uint256 _result) external {
		address metrics = pendingMetrics[_id];
		address dest = callbackAllocator[_id];
		delete pendingMetrics[_id];
		delete callbackAllocator[_id];
		IAllocator(dest).calculatedCallback(metrics, _result);
	}
}
