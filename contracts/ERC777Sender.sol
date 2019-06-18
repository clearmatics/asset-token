pragma solidity ^0.5.0;

/**
  * Token holders can be notified of operations performed on their tokens by this contract
  * Needs to be registered to the global 1820 registry
*/

contract ERC777TokensSender {

    event Created();
    event Sent(
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
      * Called by the token whenever a registered holder's token `from` are about to be moved or destroyed
      * This call happens before the token's contract state is updated
      * This function may revert to prevent the operation
    */

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
        emit Sent(operator, from, to, amount, userData, operatorData);
    }
}
