pragma solidity ^0.5.0;

import "github.com/dev-protocol/protocol/contracts/src/allocator/Allocator.sol";
import "github.com/provable-things/ethereum-api/provableAPI.sol";
import "github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary/blob/master/contracts/BokkyPooBahsDateTimeLibrary.sol";
import "./lib/StringToUint.sol";
import "./lib/Timebased.sol";

contract NpmMarket is Timebased, usingProvable {
	using StringToUint for string;
	using UintToString for uint256;
	string public schema = "['npm package', 'npm read-only token']";

	mapping(address => string) internal packages;
	mapping(bytes32 => address) internal allocator;
	mapping(bytes32 => address) internal oraclePendingQueries;
	mapping(address => uint256) lastDistributes;

	function oracleQueryNpmDownloads(
		address _allocator,
		address _metrics,
		string memory _start,
		string memory _end,
		string memory _package
	) private {
		require(
			provable_getPrice("URL") > address(this).balance,
			"Calculation query was NOT sent"
		);
		string memory url = string(
			abi.encodePacked(
				"https://api.npmjs.org/downloads/point/",
				_start,
				":",
				_end,
				"/",
				_package
			)
		);
		string memory param = string(
			abi.encodePacked("json(", url, ").downloads")
		);
		bytes32 queryId = oraclize_query("URL", param);
		allocator[queryId] = _allocator;
		oraclePendingQueries[queryId] = _metrics;
	}

	// It is expected to be called by [Oraclize](https://docs.oraclize.it/#ethereum-quick-start).
	function __callback(bytes32 _id, string memory _result) public {
		if (msg.sender != oraclize_cbAddress()) {
			revert("mismatch oraclize_cbAddress");
		}
		address metrics = oraclePendingQueries[_id];
		require(metrics != address(0), "invalid query id");
		uint256 memory count = _result.toUint(0);
		Allocator(allocator[_id]).calculatedCallback(metrics, count);
		delete allocator[_id];
		delete oraclePendingQueries[_id];
	}

	function authenticate(
		address _prop,
		string calldata npmPackage,
		string calldata npmToken
	) external returns (bool) {}

	function dateFormat(uint256 _y, uint256 _m, uint256 _d)
		internal
		pure
		returns (string memory)
	{
		return
			string(
				abi.encodePacked(
					_y.toString(),
					"-",
					_m.toString(),
					"-",
					_d.toString()
				)
			);
	}

	function calculate(address _metrics, uint256 _start, uint256 _end)
		external
		returns (bool)
	{
		uint120 startTime = timestamp(_start);
		uint120 endTime = timestamp(_end);
		(uint256 startY, uint256 startM, uint256 startD) = BokkyPooBahsDateTimeLibrary
			.timestampToDate(startTime);
		(uint256 endY, uint256 endM, uint256 endD) = BokkyPooBahsDateTimeLibrary
			.timestampToDate(endTime);
		string memory start = dateFormat(startY, startM, startD);
		string memory end = dateFormat(endY, endM, endD);
		string memory package = packages[_metrics];
		oracleQueryNpmDownloads(msg.sender, _metrics, start, end, package);
		return true;
	}

}
