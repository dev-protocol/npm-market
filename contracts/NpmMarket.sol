pragma solidity ^0.5.0;

import {IMarket} from "@dev-protocol/protocol/contracts/src/market/IMarket.sol";
// prettier-ignore
import {IAllocator} from "@dev-protocol/protocol/contracts/src/allocator/IAllocator.sol";
import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {IQueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {IQueryNpmDownloads} from "./QueryNpmDownloads.sol";


contract INpmMarket {
	string public schema;
	address public queryNpmAuthentication;
	address public queryNpmDownloads;
	bool public migratable;

	function authenticate(
		address _prop,
		string calldata _npmPackage,
		string calldata _npmReadOnlyToken,
		string calldata,
		string calldata,
		string calldata,
		address _dest
	)
		external
		returns (
			// solium-disable-next-line indentation
			bool
		);

	function authenticated(bytes32 _id, uint256 _result) external;

	function calculate(
		address _metrics,
		uint256 _begin,
		uint256 _end
	)
		external
		returns (
			// solium-disable-next-line indentation
			bool
		);

	function calculated(bytes32 _id, uint256 _result) external;

	function getPackage(address _metrics) external view returns (string memory);

	function getMetrics(string calldata _package)
		external
		view
		returns (address);

	function migrate(
		address _property,
		string memory _package,
		address _market
		// solium-disable-next-line indentation
	) public;

	function done() public;
}


contract NpmMarket is INpmMarket, Ownable {
	string public schema = "['npm package', 'npm token']";
	address public queryNpmAuthentication;
	address public queryNpmDownloads;
	bool public migratable = true;

	mapping(address => string) internal packages;
	mapping(bytes32 => address) internal metrics;
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
		bytes32 id = IQueryNpmAuthentication(queryNpmAuthentication).query(
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

	function calculate(
		address _metrics,
		uint256 _begin,
		uint256 _end
	) external returns (bool) {
		string memory package = packages[_metrics];
		bytes32 id = IQueryNpmDownloads(queryNpmDownloads).query(
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
		address _metrics = pendingMetrics[_id];
		address dest = callbackAllocator[_id];
		delete pendingMetrics[_id];
		delete callbackAllocator[_id];
		IAllocator(dest).calculatedCallback(_metrics, _result);
	}

	function register(
		address _property,
		string memory _package,
		address _market
	) private {
		bytes32 key = createKey(_package);
		address _metrics = IMarket(_market).authenticatedCallback(
			_property,
			key
		);
		packages[_metrics] = _package;
		metrics[key] = _metrics;
		emit Registered(_metrics, _package);
	}

	function createKey(string memory _package) private pure returns (bytes32) {
		return keccak256(abi.encodePacked(_package));
	}

	function getPackage(address _metrics)
		external
		view
		returns (string memory)
	{
		return packages[_metrics];
	}

	function getMetrics(string calldata _package)
		external
		view
		returns (address)
	{
		return metrics[createKey(_package)];
	}

	function migrate(
		address _property,
		string memory _package,
		address _market
	) public onlyOwner {
		require(migratable, "now is not migratable");
		register(_property, _package, _market);
	}

	function done() public onlyOwner {
		migratable = false;
	}
}
