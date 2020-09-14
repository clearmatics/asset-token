//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

/**
* @title ERC777 Token Sender Interface
* @author Andrea Di Nenno
* @notice This interface allows a token sender (EOA or Smart Contract) to add extra logic 
* to control its outgoing tokens.
*/

interface IERC777Sender {

    /**
    * @notice Called by an `ERC777` token contract before tokens are transferred or burned.
    * This call occurs before the contract state (i.e. balances) is updated and may revert to prevent transfer.
    * It is OPTIONAL both for a Smart Contract and an EOA to implement this interface.
    * @param operator address of the operator, if any, that triggered the transfer
    * @param from address of the token sender
    * @param to address of the token receiver
    * @param amount amount of tokens being sent 
    * @param userData extra information provided by the sender
    * @param operatorData extra information provided by the operator, if present
    */    
    
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external;
}
