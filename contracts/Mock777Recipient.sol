pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC777/IERC777Recipient.sol";

/**
  * Implements hooks for token received
  * Must be registered to ERC1820Registry
*/

contract Mock777Recipient is IERC777Recipient {
    event Received();

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
        emit Received();
    }
}
