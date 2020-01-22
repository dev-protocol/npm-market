pragma solidity ^0.5.0;

import {IMarket} from "@dev-protocol/protocol/contracts/src/market/IMarket.sol";
// prettier-ignore
import {IAllocator} from "@dev-protocol/protocol/contracts/src/allocator/IAllocator.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";

contract NpmMarket is Ownable {
	string public schema = "['npm package', 'npm token']";
	address public queryNpmAuthentication;
	address public queryNpmDownloads;
	bool public migratable = true;

	mapping(address => string) internal packages;
	mapping(bytes32 => address) internal callbackMarket;
	mapping(bytes32 => address) internal callbackAllocator;
	mapping(bytes32 => address) internal pendingAuthentication;
	mapping(bytes32 => string) internal pendingAuthenticationPackage;
	mapping(bytes32 => address) internal pendingMetrics;
	event Registered(address _metrics, string _package);
	event Authenticated(bytes32 _id, uint256 _result);
	event Calculated(bytes32 _id, uint256 _result);

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
		emit Authenticated(_id, _result);
		address property = pendingAuthentication[_id];
		address dest = callbackMarket[_id];
		string memory package = pendingAuthenticationPackage[_id];
		delete pendingAuthentication[_id];
		delete callbackMarket[_id];
		delete pendingAuthenticationPackage[_id];
		if (_result == 0) {
			return;
		}
		register(property, package, dest);
	}

	function calculate(address _metrics, uint256 _begin, uint256 _end)
		external
		returns (bool)
	{
		string memory package = getPackage(_metrics);
		bytes32 id = QueryNpmDownloads(queryNpmDownloads).query(
			_begin,
			_end,
			package
		);
		pendingMetrics[id] = _metrics;
		callbackAllocator[id] = msg.sender;
		return true;
	}

	function calculated(bytes32 _id, uint256 _result) external {
		emit Calculated(_id, _result);
		address metrics = pendingMetrics[_id];
		address dest = callbackAllocator[_id];
		delete pendingMetrics[_id];
		delete callbackAllocator[_id];
		IAllocator(dest).calculatedCallback(metrics, _result);
	}

	function register(
		address _property,
		string memory _package,
		address _market
	) private {
		address metrics = IMarket(_market).authenticatedCallback(_property);
		packages[metrics] = _package;
		emit Registered(metrics, _package);
	}

	function getPackage(address _metrics) public view returns (string memory) {
		return packages[_metrics];
	}

	function migrate(address _property, string memory _package, address _market)
		public
		onlyOwner
	{
		require(migratable, "now is not migratable");
		register(_property, _package, _market);
	}

	function done() public onlyOwner {
		migratable = false;
	}
}
