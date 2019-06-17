pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-eth/contracts/utils/Address.sol";

contract AssetToken is IERC777 {
    using SafeMath for uint256;
    using Address for address;

    string public _name;
    string public _symbol;
    uint256 public _totalSupply;
    uint256 public _granularity;

    mapping(address => uint256) private _balances;

    constructor(string memory name, string memory symbol, uint256 granularity) public {
        require(granularity >= 1, "Granularity MUST be at least 1")
        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = granularity;
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view returns (string memory) {
        return _totalSupply;
    }

    function decimals() external view returns (uint256) {
        return 18;
    }

    function granularity() external view returns (uint256) {
        return _granularity;
    }

    function defaultOperators() external view returns (address [] memory) {
        return _defaultOperators;
    }

    function balanceOf(address who) external view returns (uint256) {
        return _balances[who];
    }

}
