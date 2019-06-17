pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-eth/contracts/utils/Address.sol";
import "zos-lib/contracts/Initializable.sol";

contract AssetToken is IERC777, Initializable {
    using SafeMath for uint256;
    using Address for address;

    string public _name;
    string public _symbol;
    uint256 public _totalSupply;
    uint256 public _granularity;

    mapping(address => uint256) private _balances;

    function initialize(string memory name, string memory symbol) public initializer {
        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = 1;
    }

}
