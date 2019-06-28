// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

import "./IERC777Recipient.sol";
import "./IERC777Sender.sol";
import "./AssetToken.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/introspection/ERC1820Implementer.sol";

/**
 * Implements both Recipient and Sender implementer interfaces to be used in tests
*/
contract IERC777Compatible is IERC777Recipient, IERC777Sender, ERC1820Implementer {

    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    bytes32 constant private TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    bool private _shouldRevertReceive;
    bool private _shouldRevertSend;

    event Created();
    event TokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );
    event TokensToSendCalled(
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

    function setShouldRevertReceive(bool shouldRevert) public {
        _shouldRevertReceive = shouldRevert;
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
        if(_shouldRevertReceive) {
            revert("Tokens to receive revert");
        }

        emit TokensReceivedCalled(operator, from, to, amount, userData, operatorData);
    }

    /**
     * SENDER IMPLEMENTER
    */
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

    function setShouldRevertSend(bool shouldRevert) public {
        _shouldRevertSend = shouldRevert;
    }

    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    )
        external
    {
        if(_shouldRevertSend) {
            revert("Tokens to send revert");
        }

        emit TokensToSendCalled(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData
        );
    }

    function send(address payable tokenAddr, address to, uint256 amount, bytes memory data) public {
        AssetToken token = AssetToken(tokenAddr);
        token.send(to, amount, data);
    }

}
