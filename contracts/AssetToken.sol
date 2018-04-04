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
    function AssetToken(string _symbol, string _name) public {
        symbol = _symbol;
        name = _name;
        _owner = msg.sender;
        totalSupply = 0;
        decimals = 3;
    }

    event FundEvent(address indexed member, uint256 value);
    event DefundEvent(address indexed member, uint256 value);

    function fund(address member, uint256 value) public onlyOwner {
        _balances[member] = _balances[member].add(value);
        totalSupply = totalSupply.add(value);

        emit FundEvent(member, value);
    }

    function defund(address member, uint256 value) public onlyOwner {
        _balances[member] = _balances[member].sub(value);
        totalSupply = totalSupply.sub(value);

        emit DefundEvent(member, value);
    }

    // Fallback that prevents ETH from being sent to this contract
    function () public payable {
        revert();
    }
}
