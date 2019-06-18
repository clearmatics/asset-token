pragma solidity ^0.5.0;

/**
  * Implements hooks for token received
  * Must be registered to ERC1820Registry
*/

contract ERC777TokensRecipient {

    event Created();
    event Received(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes userData,
        bytes operatorData
    );

    constructor() public {
        emit Created();
    }

    /**
     * Called by the 777 contract whenever `to` is a registered account
     * This call occurs _after_ the token contract's state is updated
     *
     * This function may revert to prevent the operation from being executed.
     */

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
        emit Received(operator, from, to, amount, userData, operatorData);
    }
}
