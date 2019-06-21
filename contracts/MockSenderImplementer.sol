// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

import "./IERC777Recipient.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/introspection/ERC1820Implementer.sol";

contract MockSenderContract is IERC777Recipient, ERC1820Implementer {
    bytes32 constant private TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    bool private _shouldRevert;

    event Created();
    event TokensToSendCalled(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes data,
        bytes operatorData,
        address token,
        uint256 fromBalance,
        uint256 toBalance
    );
    event Registered(address who, address implementer);

    constructor() public {
        emit Created();
    }

    function senderFor(address account) public {
        _registerInterfaceForAddress(TOKENS_SENDER_INTERFACE_HASH, account);

        emit Registered(account, address(this));

        address self = address(this);
        if (account == self) {
            registerSender(self);
        }
    }

    //register association into the universal registry
    function registerSender(address recipient) public {
        _erc1820.setInterfaceImplementer(address(this), TOKENS_SENDER_INTERFACE_HASH, recipient);
    }

    function setShouldRevert(bool shouldRevert) public {
        _shouldRevert = shouldRevert;
    }

}
