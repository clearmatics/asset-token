# [🔗](/interfaces/IERC777Recipient.sol#L7) IERC777Recipient
**Author** _Andrea Di Nenno_

This interface allows a token receiver (EOA or Smart Contract) to add extra logic to control its incoming tokens.


# Functions
## [🔗](/interfaces/IERC777Recipient.sol#L16) `tokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData)`

Called by an `ERC777` token contract whenever tokens are being moved or created into an account.

This call occurs after the contract state (i.e. balances) is updated and may revert to prevent transfer.

It is MANDATORY for a Smart Contract that intends to receive and manage tokens to implement this interface, or each transfer to it would revert.




### Parameters
* `operator` address of the operator, if any, that triggered the transfer
* `from` address of the token sender
* `to` address of the token receiver
* `amount` amount of tokens being sent
* `userData` extra information provided by the sender
* `operatorData` extra information provided by the operator, if present

