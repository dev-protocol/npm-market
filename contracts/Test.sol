pragma solidity ^0.5.0;

import {QueryNpmAuthentication} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloads} from "./QueryNpmDownloads.sol";
// prettier-ignore
import {IMarketBehavior} from "@dev-protocol/protocol/contracts/src/market/IMarketBehavior.sol";
import {QueryNpmAuthenticationCore} from "./QueryNpmAuthentication.sol";
import {QueryNpmDownloadsCore} from "./QueryNpmDownloads.sol";

contract ProvableTest {
	address payable public owner;
	event ProvableQuery(string _f, string _a);

	constructor() public {
		owner = msg.sender;
	}

	function provable_getPrice() internal pure returns (uint256) {
		return 1;
	}
	function provable_query(string memory _f, string memory _a)
		internal
		returns (bytes32)
	{
		emit ProvableQuery(_f, _a);
		return "query_id";
	}
	function provable_cbAddress() internal returns (address) {
		return owner;
	}
}

contract QueryNpmAuthenticationTest is
	QueryNpmAuthenticationCore,
	ProvableTest
{
	constructor() public ProvableTest() {}
}
contract QueryNpmDownloadsTest is QueryNpmDownloadsCore, ProvableTest {
	constructor() public ProvableTest() {}
}

contract Market {
	address public behavior;
	address public lastProperty;

	constructor(address _behavior) public {
		behavior = _behavior;
	}

	function authenticate(
		address _prop,
		string memory _args1,
		string memory _args2,
		string memory _args3,
		string memory _args4,
		string memory _args5
	) public returns (address) {
		IMarketBehavior(behavior).authenticate(
			_prop,
			_args1,
			_args2,
			_args3,
			_args4,
			_args5,
			address(this)
		);
		return address(this);
	}

	function authenticatedCallback(address _prop) public returns (address) {
		lastProperty = _prop;
		return _prop;
	}
}

contract Allocator {
	address public behavior;
	address public lastMetricsAddress;
	uint256 public lastMetricsValue;

	constructor(address _behavior) public {
		behavior = _behavior;
	}

	function allocate(address _metrics, uint256 _start, uint256 _end) public {
		IMarketBehavior(behavior).calculate(_metrics, _start, _end);
	}

	function calculatedCallback(address _metrics, uint256 _value) public {
		lastMetricsAddress = _metrics;
		lastMetricsValue = _value;
	}
}
