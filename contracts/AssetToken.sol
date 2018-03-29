pragma solidity ^0.4.19;

 /**
 * @title Contract that will work with ERC223 tokens.
 */

import "./ERC223Token.sol";

/**
 * @title ERC223 standard token implementation.
 */
contract AssetToken is ERC223Token {
    using SafeMath for uint;

    uint public totalSupply;

    string private _symbol;
    string private _name;

    // Owner of this contract
    address private _owner;

    // Functions with this modifier can only be executed by the owner
    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert();
        }
        _;
    }

    // Constructor
    function AssetToken(string symbol, string name) public {
        _symbol = symbol;
        _name = name;
        _owner = msg.sender;
        totalSupply = 0;
    }

    function transferWithData(address to, uint value, bytes data) public {
        transfer(to, value, data);
    }

    function transferNoData(address to, uint value) public {
        transfer(to, value);
    }

    function fund(address member, uint256 value) public onlyOwner {
        _balances[member] = _balances[member].add(value);
        totalSupply = totalSupply.add(value);
    }

    function defund(address member, uint256 value) public onlyOwner {
        _balances[member] = _balances[member].sub(value);
        totalSupply = totalSupply.sub(value);
    }

    // Fallback that prevents ETH from being sent to this contract
    function () public payable {
        revert();
    }
}
