//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;


interface IERC777Recipient {
    /**
     * @dev Called by an `IERC777` token contract whenever tokens are being
     * moved or created into a registered account (`to`).

     * This call occurs after the contract state is updated and may revert to prevent transfer
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
