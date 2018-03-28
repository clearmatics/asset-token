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

    string private symbol;
    string private name;

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
    }

    function transferWithData(address _to, uint _value, bytes _data) public {
        transfer(_to, _value, _data);
    }

    function transferNoData(address _to, uint _value) public {
        transfer(_to, _value);
    }

    function fund(address _member, uint256 _value) public onlyOwner {
        balances[_member] = balances[_member].add(_value);
        totalSupply = totalSupply.add(_value);
    }

    function defund(address _member, uint256 _value) public onlyOwner {
        balances[_member] = balances[_member].sub(_value);
        totalSupply = totalSupply.sub(_value);
    }

    // Fallback that prevents ETH from being sent to this contract
    function () public payable {
        revert();
    }
}
