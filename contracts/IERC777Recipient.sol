//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

/**
* @title ERC777 Token Recipient Interface
* @author Andrea Di Nenno
* @notice This interface allows a token receiver (EOA or Smart Contract) to add extra logic 
* to control his incoming tokens.
*/

interface IERC777Recipient {

    /**
    * @notice Called by an `ERC777` token contract whenever tokens are moved or created into an account
    * This call occurs after the contract state (i.e. balances) is updated and may revert to prevent transfer.
    * It is MANDATORY for a Smart Contract that intends to receive and manage tokens to implement this interface, 
    * or each transfer to it would revert.
    * @param operator address of the operator, if any, that triggered the transfer
    * @param from address of the token sender
    * @param to address of the token receiver
    * @param amount amount of tokens being sent 
    * @param userData extra information provided by the sender
    * @param operatorData extra information provided by the operator, if present
    */

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external;
}
