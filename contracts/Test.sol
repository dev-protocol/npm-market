pragma solidity ^0.5.0;

// prettier-ignore
import {IMarketBehavior} from "@dev-protocol/protocol/contracts/src/market/IMarketBehavior.sol";
import {ERC20} from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
// prettier-ignore
import {ERC20Detailed} from "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import {NpmMarket} from "./NpmMarket.sol";


contract Metrics {
	address public market;
	address public property;

	constructor(address _property) public {
		market = msg.sender;
		property = _property;
	}
}


contract MarketFactory {
	event Create(address indexed _from, address _market);

	function create(address _addr) external returns (address);
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

	function authenticatedCallback(address _prop, bytes32 _key)
		public
		returns (address)
	{
		lastProperty = _prop;
		return address(new Metrics(_prop));
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


contract Property is ERC20, ERC20Detailed {
	uint8 private constant _decimals = 18;
	uint256 private constant _supply = 10000000;
	address public author;

	constructor(address _own, string memory _name, string memory _symbol)
		public
		ERC20Detailed(_name, _symbol, _decimals)
	{
		author = _own;
		_mint(author, _supply);
	}
}


contract PropertyFactory {
	event Create(address indexed _from, address _property);

	function create(string memory _name, string memory _symbol, address _author)
		public
		returns (address)
	{
		Property property = new Property(_author, _name, _symbol);
		emit Create(msg.sender, address(property));
	}
}


contract NpmMarketTest is NpmMarket {
	constructor(address _queryNpmAuthentication, address _queryNpmDownloads)
		public
		NpmMarket(_queryNpmAuthentication, _queryNpmDownloads)
	{}

	function setPackages(string memory _pkg, address _metrics) public {
		packages[_metrics] = _pkg;
		metrics[keccak256(abi.encodePacked(_pkg))] = _metrics;
	}
}
