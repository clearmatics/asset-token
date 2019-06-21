// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

import "./IERC777Recipient.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/introspection/ERC1820Implementer.sol";

contract MockRecipientContract is IERC777Recipient, ERC1820Implementer {

    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    bool private _shouldRevert;

    event Created();
    event TokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );
    event Registered(address who, address implementer);

    constructor() public {
        emit Created();
    }

    /**
     * @dev Declares the contract as willing to be an implementer of
     * `interfaceHash` for `account`.
     *  under the hood register the association for future
     *  canImplementInterfaceForAddress calls from token contract
    */
    function recipientFor(address account) public {
        _registerInterfaceForAddress(TOKENS_RECIPIENT_INTERFACE_HASH, account);

        emit Registered(account, address(this));

        address self = address(this);
        if (account == self) {
            registerRecipient(self);
        }
    }

    //register association into the universal registry
    function registerRecipient(address recipient) public {
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, recipient);
    }

    function setShouldRevert(bool shouldRevert) public {
        _shouldRevert = shouldRevert;
    }

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    )
        external
    {
        if(_shouldRevert) {
            revert();
        }

        emit TokensReceivedCalled(operator, from, to, amount, userData, operatorData);
    }

}
