pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC777TokensRecipient standard as defined in the EIP.
 * to be extended by a contract to receive tokens
 */
interface IERC777Recipient {
    /**
     * @dev Called by an `IERC777` token contract whenever tokens are being
     * moved or created into a registered account (`to`).

     * This call occurs _after_ the token contract's state is updated
     *
     * This function may revert to prevent the transfer operation from being executed.
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
