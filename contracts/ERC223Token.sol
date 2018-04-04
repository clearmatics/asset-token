pragma solidity ^0.4.19;

import './ERC20CompatibleToken.sol';
import './ERC223Interface.sol';
import './ERC223ReceivingContract.sol';
import './SafeMath.sol';

contract ERC223Token is ERC223Interface, ERC20CompatibleToken {
    using SafeMath for uint;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    /**
     * @dev Function to access name of token.
     */
    function name() public view returns (string) {
        return name;
    }

    /**
     * @dev Function to access symbol of token.
     */
    function symbol() public view returns (string) {
        return symbol;
    }

    /**
     * @dev Function to access decimals of token.
     */
    function decimals() public view returns (uint8) {
        return decimals;
    }

    /**
     * @dev Function to access total supply of tokens.
     */
    function totalSupply() public view returns (uint256) {
        return totalSupply;
    }

    /**
     * @dev Transfer the specified amount of tokens to the specified address.
     *      This function works the same with the previous one
     *      but doesn't contain `_data` param.
     *      Added due to backwards compatibility reasons.
     *
     * @param to    Receiver address.
     * @param value Amount of tokens that will be transferred.
     */
    function transfer(address to, uint value) public {
        uint codeLength;
        bytes memory empty;

        assembly {
            // Retrieve the size of the code on target address, this needs assembly .
            codeLength := extcodesize(to)
        }

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        if(codeLength>0) {
            ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
            receiver.tokenFallback(msg.sender, value, empty);
        }
        Transfer(msg.sender, to, value, empty);
    }

    /**
     * @dev Transfer the specified amount of tokens to the specified address.
     *      Invokes the `tokenFallback` function if the recipient is a contract.
     *      The token transfer fails if the recipient is a contract
     *      but does not implement the `tokenFallback` function
     *      or the fallback function to receive funds.
     *
     * @param to    Receiver address.
     * @param value Amount of tokens that will be transferred.
     * @param data  Transaction metadata.
     */
    function transfer(address to, uint value, bytes data) public {
        // Standard function transfer similar to ERC20 transfer with no _data .
        // Added due to backwards compatibility reasons .
        uint codeLength;

        assembly {
            // Retrieve the size of the code on target address, this needs assembly .
            codeLength := extcodesize(to)
        }

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        if(codeLength>0) {
            ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
            receiver.tokenFallback(msg.sender, value, data);
        }
        Transfer(msg.sender, to, value, data);
    }

    /**
     * @dev Transfer the specified amount of tokens to the specified address.
     *      Invokes the `tokenFallback` function if the recipient is a contract.
     *      The token transfer fails if the recipient is a contract
     *      but does not implement the `tokenFallback` function
     *      or the fallback function to receive funds.
     *
     * @param to              Receiver address.
     * @param value           Amount of tokens that will be transferred.
     * @param data  	      Transaction metadata.
     * @param custom_fallback Name of the fallback function to call
     */
    function transfer(address to, uint value, bytes data, string custom_fallback) public returns (bool) {
        // Standard function transfer similar to ERC20 transfer with no _data .
        // Added due to backwards compatibility reasons .
        uint codeLength;

        assembly {
            // Retrieve the size of the code on target address, this needs assembly .
            codeLength := extcodesize(to)
        }

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);

        if(codeLength>0) {
	    assert(to.call.value(0)(bytes4(keccak256(custom_fallback)), msg.sender, value, data));
            Transfer(msg.sender, to, value, data);
        }
        Transfer(msg.sender, to, value, data);
    }

    /**
     * @dev Returns balance of the `_owner`.
     *
     * @param owner   The address whose balance will be returned.
     * @return balance Balance of the `_owner`.
     */
    function balanceOf(address owner) public constant returns (uint balance) {
        return _balances[owner];
    }
}
