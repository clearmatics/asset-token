pragma solidity 0.4.21;


contract ERC223ReceivingContract {
    /**
    * @dev Standard ERC223 function that will handle incoming token transfers.
    *
    * @param from  Token sender address.
    * @param value Amount of tokens.
    * @param data  Transaction metadata.
    */
    function tokenFallback(address from, uint value, bytes data) public;
}
