# [🔗](/interfaces/IAssetToken.sol#L7) IAssetToken
**Author** _Zoe Nolan, Andrea Di Nenno, George Ornbo_

The Asset Token is a smart contract designed to represent a fungible asset with offchain interaction
# Functions
## [🔗](/interfaces/IAssetToken.sol#L32) `initialize(string symbol, string name, address owner, undefined defaultOperators, int status, uint256 granularity, address registry1820Addr)`

Initialize is the constructor of the token


### Parameters
* `symbol` token symbol
* `name` token name
* `owner` initial address of the token `owner`, `emergencyDelegate`, `fundingDelegate`, `listController`. Will be able to select other addresses for such roles
* `defaultOperators` list of addresses that by default are operators for all addresses. Can be empty
* `status` defines the ListStatus (0=noFilter, 1=Blacklist, 2=Whitelist)
* `granularity` smallest part of the token that's not divisible
* `registry1820Addr` address of the deployed ERC1820 registry

## [🔗](/interfaces/IAssetToken.sol#L52) `denyAddress(address who)`

Prevents an address from being able to transfer tokens.

Only the `listController` can call it.

Will revert if the token is in NoFilter mode - `ListStatus(0)`.

`Denied` event is emitted


### Parameters
* `who` target address

## [🔗](/interfaces/IAssetToken.sol#L61) `allowAddress(address who)`

Allows an address to transfer tokens.

Only the `listController` can call it.

Will revert if the token is in NoFilter mode - `ListStatus(0)`.

`Allowed` event is emitted


### Parameters
* `who` target address

## [🔗](/interfaces/IAssetToken.sol#L70) `switchListStatus(uint8 status)`

Changes the List Status.

Only the `listController` can call it.

`SwitchListStatus` event is emitted.




### Parameters
* `status` undefined

## [🔗](/interfaces/IAssetToken.sol#L78) `authorizeOperator(address operator)`

Authorizes an address to be an operator for the caller, that is to being able to transfer tokens on his behalf.

Reverts if the caller authorizes himself `AuthorizedOperator` event is emitted.




### Parameters
* `operator` address of the operator

## [🔗](/interfaces/IAssetToken.sol#L86) `revokeOperator(address operator)`

Revokes authorization for an address to be an operator for the caller.

Reverts if the caller revokes himself `RevokedOperator` event is emitted.




### Parameters
* `operator` address of the operator

## [🔗](/interfaces/IAssetToken.sol#L94) `setEmergencyPermission(address who)`

Sets an address as the `emergencyDelegate`, the only able to freeze the contract.

Only the contract owner can call it.

`EmergencyDelegation` event is emitted.




### Parameters
* `who` target address

## [🔗](/interfaces/IAssetToken.sol#L102) `setFundingPermission(address who)`

Sets an address as the `fundingDelegate`, the only able to issue tokens to holders.

Only the contract owner can call it.

`FundingDelegation` event is emitted.




### Parameters
* `who` target address

## [🔗](/interfaces/IAssetToken.sol#L110) `setListsController(address who)`

Sets an address as the `listController`, the only able to switch list, deny and allow addresses.

Only the contract owner can call it.

`ListDelegation` event is emitted.




### Parameters
* `who` target address

## [🔗](/interfaces/IAssetToken.sol#L118) `emergencyStop()`

Freezes trading of tokens.

Only the `emergencyDelegate` can call it.

`Switch` event is emitted.




## [🔗](/interfaces/IAssetToken.sol#L125) `emergencyStart()`

Resumes trading of tokens after an `emergencyStop` was called.

Only the `emergencyDelegate` can call it.

`Switch` event is emitted.




## [🔗](/interfaces/IAssetToken.sol#L132) `fund(address member, uint256 value)`

Issues tokens to a specific address, increasing his balance and the total supply.

Calls the `tokensReceived` hook of the receiver address as per ERC777.

Only the `fundingDelegate` can call it.

Will revert if `value` doesn't respect the granularity.

Will revert if the contract is in a frozen state after an `emergencyStop`.

Will revert if the target address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.

`Minted` and `Fund` events are emitted.




### Parameters
* `member` address funded. Must not be `address(0)`
* `value` amount of tokens issued

## [🔗](/interfaces/IAssetToken.sol#L145) `burn(uint256 amount, bytes data)`

Burns tokens of the caller, decreasing his balance and the total supply.

Calls the `tokensToSend` hook of the caller address as per ERC777.

Will revert if `value` doesn't respect the granularity.

Will revert if the contract is in a frozen state after an `emergencyStop`.

Will revert if the caller address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.

`Burn` event  emitted


### Parameters
* `amount` amount of tokens to burn
* `data` extra information provided by the caller

## [🔗](/interfaces/IAssetToken.sol#L157) `operatorBurn(address from, uint256 amount, bytes data, bytes operatorData)`

Burns tokens of an address from his operator, reducing his balance and the total supply.

Calls the `tokensToSend` hook of the target address as per ERC777.

Will revert if the caller is not an operator of the `from` address.

Will revert if `amount` doesn't respect the granularity.

Will revert if the contract is in a frozen state after an `emergencyStop`.

Will revert if the caller address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.

`Burn` event  emitted


### Parameters
* `from` address whose tokens are burned. Must not be `address(0)`
* `amount` amount of tokens to burn
* `data` extra information provided by the token holder
* `operatorData` extra information provided by the operator account

## [🔗](/interfaces/IAssetToken.sol#L177) `send(address recipient, uint256 amount, bytes data)`

Transfer tokens between addresses.

Will trigger `tokensToSend` and `tokensReceived` hooks as per ERC777.

Will revert if `amount` doesn't respect the granularity.

Will revert if the caller is not allowed to use the token contract (i.e. blacklisted or not whitelisted if the contract is initialised in a list mode operation).

Will revert if the contract is in a frozen state after an `emergencyStop`.

Will revert if the recipient is  either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.

`Sent` event emitted


### Parameters
* `recipient` address of the tokens recipient. Must not be `address(0)`
* `amount` amount of tokens to send
* `data` extra information provided by the caller

## [🔗](/interfaces/IAssetToken.sol#L192) `operatorSend(address from, address to, uint256 amount, bytes data, bytes operatorData)`

Transfer tokens of an address but called from his operator.

Will trigger `tokensToSend` and `tokensReceived` hooks as per ERC777.

Will revert if `amount` doesn't respect the granularity.

Will revert if the caller is not an operator of the token holder.

Will revert if the operator or the token holder are not allowed to use the token contract (i.e. blacklisted or not whitelisted if the contract is initialised in a list mode operation).

Will revert if the contract is in a frozen state after an `emergencyStop`.

Will revert if the recipient is  either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.

`Sent` event emitted.




### Parameters
* `from` address of the token holder (the sender). Must not be `address(0)`
* `to` address of the tokens recipient. Must not be `address(0)`
* `amount` amount of tokens to send
* `data` extra information provided by the token holder
* `operatorData` extra information provided by the operator

## [🔗](/interfaces/IAssetToken.sol#L216) `name()`

View function

### Returns
* `string` String name of the token

## [🔗](/interfaces/IAssetToken.sol#L222) `symbol()`

View function

### Returns
* `string` String symbol of the token

## [🔗](/interfaces/IAssetToken.sol#L228) `totalSupply()`

View function

### Returns
* `uint256` Total Supply of tokens currently in circulation

## [🔗](/interfaces/IAssetToken.sol#L234) `granularity()`

View function

### Returns
* `uint256` Granularity of the token, as the smallest part of the token that's not divisible

## [🔗](/interfaces/IAssetToken.sol#L240) `balanceOf(address who)`

View function


### Parameters
* `who` queried address
### Returns
* `uint256` The balance of the specified address

## [🔗](/interfaces/IAssetToken.sol#L247) `defaultOperators()`

View function

### Returns
* `undefined` The list of the default operator addresses

## [🔗](/interfaces/IAssetToken.sol#L253) `getTradingStatus()`

View function

### Returns
* `bool` `True` if trading is active, `False` if frozen

## [🔗](/interfaces/IAssetToken.sol#L259) `getListStatus()`

View function

### Returns
* `ListStatus` The List mechanism in use (0=noFilter, 1=Blacklist, 2=Whitelist)

## [🔗](/interfaces/IAssetToken.sol#L265) `isAllowedToSend(address who)`

View function


### Parameters
* `who` queried address
### Returns
* `bool` `True` if the address is allowd, `False` if not

## [🔗](/interfaces/IAssetToken.sol#L272) `isOperatorFor(address operator, address holder)`

View function


### Parameters
* `operator` operator queried address
* `holder` token holder queried address
### Returns
* `bool` `True` if operator for the holder, `False` if not

## [🔗](/interfaces/IAssetToken.sol#L280) `isMultipleOfGranularity(uint amount)`

View function


### Parameters
* `amount` number queried
### Returns
* `bool` `True` if the amount respects granularity, `False` if not

## [🔗](/interfaces/IAssetToken.sol#L287) `decimals()`

View function

### Returns
* `uint256` Decimal positions of the token. Fixed to 18

