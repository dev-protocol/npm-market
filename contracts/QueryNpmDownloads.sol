pragma solidity ^0.5.0;

import {Timebased} from "./lib/Timebased.sol";
import {INpmMarket} from "./NpmMarket.sol";
import {Chargeable} from "./lib/Chargeable.sol";
import {Queryable} from "./lib/Queryable.sol";


contract IQueryNpmDownloads {
	function query(
		uint256 _beginTime,
		uint256 _endTime,
		string calldata _package
	)
		external
		returns (
			// solium-disable-next-line indentation
			bytes32
		);

	function __callback(bytes32 _id, string memory _result) public;
}


contract QueryNpmDownloads is
	IQueryNpmDownloads,
	Queryable,
	Chargeable,
	Timebased
{
	uint24 constant SECONDS_PER_DAY = 86400;

	mapping(bytes32 => address) internal callbackDestinations;
	event Queried(uint256 _begin, uint256 _end, string _package);

	function query(
		uint256 _beginTime,
		uint256 _endTime,
		string calldata _package
	) external returns (bytes32) {
		require(
			provable_getPrice("URL", queryGasLimit) < charged(),
			"Calculation query was NOT sent"
		);
		uint256 beginTime = timestamp(_beginTime);
		uint256 endTime = timestamp(_endTime) - SECONDS_PER_DAY;
		require(
			endTime - beginTime > SECONDS_PER_DAY,
			"The calculation period must be at more than 48 hours"
		);
		(string memory begin, string memory end) = date(beginTime, endTime);
		string memory url = string(
			abi.encodePacked(
				"https://api.npmjs.org/downloads/point/",
				begin,
				":",
				end,
				"/",
				_package
			)
		);
		string memory param = string(
			abi.encodePacked("json(", url, ").downloads")
		);
		bytes32 id = provable_query("URL", param, queryGasLimit);
		emit Queried(beginTime, endTime, _package);
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
		INpmMarket(callback).calculated(_id, result);
	}

	// The function is based on bokkypoobah/BokkyPooBahsDateTimeLibrary._daysToDate
	// https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary
	function secondsToDate(uint256 _seconds)
		private
		pure
		returns (
			uint256 year,
			uint256 month,
			uint256 day
		)
	{
		int256 __days = int256(_seconds / 86400);

		int256 L = __days + 68569 + 2440588;
		int256 N = (4 * L) / 146097;
		L = L - (146097 * N + 3) / 4;
		int256 _year = (4000 * (L + 1)) / 1461001;
		L = L - (1461 * _year) / 4 + 31;
		int256 _month = (80 * L) / 2447;
		int256 _day = L - (2447 * _month) / 80;
		L = _month / 11;
		_month = _month + 2 - 12 * L;
		_year = 100 * (N - 49) + _year + L;

		year = uint256(_year);
		month = uint256(_month);
		day = uint256(_day);
	}

	function dateFormat(
		uint256 _y,
		uint256 _m,
		uint256 _d
	) private pure returns (string memory) {
		return
			string(
				abi.encodePacked(
					uint2str(_y),
					"-",
					uint2str(_m),
					"-",
					uint2str(_d)
				)
			);
	}

	function date(uint256 _begin, uint256 _end)
		private
		pure
		returns (string memory begin, string memory end)
	{
		(uint256 beginY, uint256 beginM, uint256 beginD) = secondsToDate(
			_begin
		);
		(uint256 endY, uint256 endM, uint256 endD) = secondsToDate(_end);
		string memory beginDate = dateFormat(beginY, beginM, beginD);
		string memory endDate = dateFormat(endY, endM, endD);
		return (beginDate, endDate);
	}
}
