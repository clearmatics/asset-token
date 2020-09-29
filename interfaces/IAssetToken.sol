//Copyright (c) 2020 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

/**
* @title Asset Token 
* @author Zoe Nolan, Andrea Di Nenno, George Ornbo
* @notice The Asset Token is a smart contract designed to represent a fungible asset with offchain interaction  
*/
 
interface IAssetToken {

    /**  
    * @notice Specifies the token authorization mechanism : 
    * NoFilter: every address is allowed to transfer tokens
    * Blacklist: by default every address is allowed to transfer tokens, owner adds addresses to the blacklist
    * Whitelist: by default every address is NOT allowed to transfer tokens, owner adds addresses to the whitelist
    */
    enum ListStatus {NoFilter, Blacklist, Whitelist}

    event EmergencyDelegation(address indexed member);
    event FundingDelegation(address indexed member);
    event Switch(bool balance);
    event Fund(address indexed member, uint256 value, uint256 balance);
    event ListDelegation(address indexed member);
    event Denied(address indexed who, ListStatus status);
    event Allowed(address indexed who, ListStatus status);
    event SwitchListStatus(ListStatus status);

    /**
    * @notice Initialize is the constructor of the token
    * @param symbol token symbol  
    * @param name token name  
    * @param owner initial address of the token `owner`, `emergencyDelegate`, `fundingDelegate`, `listController`. Will be able to select other addresses for such roles
    * @param defaultOperators list of addresses that by default are operators for all addresses. Can be empty 
    * @param status defines the ListStatus (0=noFilter, 1=Blacklist, 2=Whitelist)
    * @param granularity smallest part of the token that's not divisible
    * @param registry1820Addr address of the deployed ERC1820 registry 
    */
    function initialize(
        string calldata symbol,
        string calldata name,
        address owner,
        address[] calldata defaultOperators,
        uint8 status,
        uint256 granularity,
        address registry1820Addr
    ) external;

    /**
    * @notice Prevents an address from being able to transfer tokens. 
    * Only the `listController` can call it. 
    * Will revert if the token is in NoFilter mode - `ListStatus(0)`. 
    * `Denied` event is emitted
    * @param who target address 
    */
    function denyAddress(address who) external;

    /**
    * @notice Allows an address to transfer tokens. 
    * Only the `listController` can call it. 
    * Will revert if the token is in NoFilter mode - `ListStatus(0)`. 
    * `Allowed` event is emitted 
    * @param who target address 
    */
    function allowAddress(address who) external;

    /**
    * @notice Changes the List Status. 
    * Only the `listController` can call it. 
    * `SwitchListStatus` event is emitted.
    * @param status   
    */
    function switchListStatus(uint8 status) external;

    /**
    * @notice Authorizes an address to be an operator for the caller, that is to being able to transfer tokens on his behalf.
    * Reverts if the caller authorizes himself
    * `AuthorizedOperator` event is emitted. 
    * @param operator address of the operator 
    */
    function authorizeOperator(address operator) external;

    /**
    * @notice Revokes authorization for an address to be an operator for the caller.
    * Reverts if the caller revokes himself
    * `RevokedOperator` event is emitted. 
    * @param operator address of the operator 
    */
    function revokeOperator(address operator) external;

    /**
    * @notice Sets an address as the `emergencyDelegate`, the only able to freeze the contract. 
    * Only the contract owner can call it. 
    * `EmergencyDelegation` event is emitted.
    * @param who target address  
    */
    function setEmergencyPermission(address who) external;

    /**
    * @notice Sets an address as the `fundingDelegate`, the only able to issue tokens to holders. 
    * Only the contract owner can call it. 
    * `FundingDelegation` event is emitted. 
    * @param who target address 
    */
    function setFundingPermission(address who) external;

    /**
    * @notice Sets an address as the `listController`, the only able to switch list, deny and allow addresses. 
    * Only the contract owner can call it. 
    * `ListDelegation` event is emitted. 
    * @param who target address 
    */
    function setListsController(address who) external;

    /**
    * @notice Freezes trading of tokens. 
    * Only the `emergencyDelegate` can call it. 
    * `Switch` event is emitted. 
    */
    function emergencyStop() external;

    /**
    * @notice Resumes trading of tokens after an `emergencyStop` was called.
    * Only the `emergencyDelegate` can call it. 
    * `Switch` event is emitted. 
    */
    function emergencyStart() external;

    /**
    * @notice Issues tokens to a specific address, increasing his balance and the total supply.
    * Calls the `tokensReceived` hook of the receiver address as per ERC777.
    * Only the `fundingDelegate` can call it. 
    * Will revert if `value` doesn't respect the granularity. 
    * Will revert if the contract is in a frozen state after an `emergencyStop`.
    * Will revert if the target address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`. 
    * `Minted` and `Fund` events are emitted.
    * @param member address funded. Must not be `address(0)`
    * @param value amount of tokens issued
    */
    function fund(address member, uint256 value) external;

    /**
    * @notice Burns tokens of the caller, decreasing his balance and the total supply.
    * Calls the `tokensToSend` hook of the caller address as per ERC777.
    * Will revert if `value` doesn't respect the granularity.
    * Will revert if the contract is in a frozen state after an `emergencyStop`.
    * Will revert if the caller address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`. 
    * `Burn` event  emitted 
    * @param amount amount of tokens to burn
    * @param data extra information provided by the caller
    */
    function burn(uint256 amount, bytes calldata data) external;

    /**
    * @notice Burns tokens of an address from his operator, reducing his balance and the total supply.
    * Calls the `tokensToSend` hook of the target address as per ERC777.
    * Will revert if the caller is not an operator of the `from` address.
    * Will revert if `amount` doesn't respect the granularity.
    * Will revert if the contract is in a frozen state after an `emergencyStop`. 
    * Will revert if the caller address is either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`. 
    * `Burn` event  emitted 
    * @param from address whose tokens are burned. Must not be `address(0)`
    * @param amount amount of tokens to burn
    * @param data extra information provided by the token holder
    * @param operatorData extra information provided by the operator account
    */
    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    /**
    * @notice Transfer tokens between addresses.
    * Will trigger `tokensToSend` and `tokensReceived` hooks as per ERC777.
    * Will revert if `amount` doesn't respect the granularity.
    * Will revert if the caller is not allowed to use the token contract
    * (i.e. blacklisted or not whitelisted if the contract is initialised in a list mode operation).
    * Will revert if the contract is in a frozen state after an `emergencyStop`. 
    * Will revert if the recipient is  either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.
    * `Sent` event emitted
    * @param recipient address of the tokens recipient. Must not be `address(0)`
    * @param amount amount of tokens to send
    * @param data extra information provided by the caller
    */
    function send(address recipient, uint256 amount, bytes calldata data) external;

    /**
    * @notice Transfer tokens of an address but called from his operator. 
    * Will trigger `tokensToSend` and `tokensReceived` hooks as per ERC777.
    * Will revert if `amount` doesn't respect the granularity.
    * Will revert if the caller is not an operator of the token holder.
    * Will revert if the operator or the token holder are not allowed to use the token contract
    * (i.e. blacklisted or not whitelisted if the contract is initialised in a list mode operation).
    * Will revert if the contract is in a frozen state after an `emergencyStop`. 
    * Will revert if the recipient is  either the `owner`, `fundingDelegate`, `emergencyDelegate`, or `listController`.
    * `Sent` event emitted.
    * @param from address of the token holder (the sender). Must not be `address(0)`
    * @param to address of the tokens recipient. Must not be `address(0)`
    * @param amount amount of tokens to send
    * @param data extra information provided by the token holder
    * @param operatorData extra information provided by the operator
    */
    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    /**
    * @notice View function
    * @return Address of the token owner
    */
    function owner() external view returns (address);

    /**
    * @notice View function
    * @return String name of the token 
    */
    function name() external view returns (string memory);

    /**
    * @notice View function
    * @return String symbol of the token 
    */
    function symbol() external view returns (string memory);

    /**
    * @notice View function
    * @return Total Supply of tokens currently in circulation
    */
    function totalSupply() external view returns (uint256);

    /**
    * @notice View function
    * @return Granularity of the token, as the smallest part of the token that's not divisible
    */
    function granularity() external view returns (uint256);

    /**
    * @notice View function
    * @param who queried address
    * @return The balance of the specified address
    */
    function balanceOf(address who) external view returns (uint256);

    /**
    * @notice View function
    * @return The list of the default operator addresses
    */
    function defaultOperators() external view returns (address[] memory);

    /**
    * @notice View function
    * @return `True` if trading is active, `False` if frozen
    */
    function getTradingStatus() external view returns (bool);

    /**
    * @notice View function
    * @return The List mechanism in use (0=noFilter, 1=Blacklist, 2=Whitelist)
    */
    function getListStatus() external view returns (ListStatus);

    /**
    * @notice View function
    * @param who queried address
    * @return `True` if the address is allowd, `False` if not
    */
    function isAllowedToSend(address who) external view returns (bool);

    /**
    * @notice View function
    * @param holder token holder queried address
    * @param operator operator queried address
    * @return `True` if operator for the holder, `False` if not
    */
    function isOperatorFor(address operator, address holder) external view returns (bool);

    /**
    * @notice View function
    * @param amount number queried
    * @return `True` if the amount respects granularity, `False` if not
    */
    function isMultipleOfGranularity(uint amount) external view returns (bool);

    /**
    * @notice View function
    * @return Decimal positions of the token. Fixed to 18
    */
    function decimals() external pure returns (uint256);
}
