//Copyright (c) 2020 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;

interface AssetToken {

    enum ListStatus {NoFilter, Blacklist, Whitelist}

    event EmergencyDelegation(address indexed member);
    event FundingDelegation(address indexed member);
    event Switch(bool balance);
    event Fund(address indexed member, uint256 value, uint256 balance);
    event ListDelegation(address indexed member);
    event Denied(address indexed who, ListStatus status);
    event Allowed(address indexed who, ListStatus status);
    event SwitchListStatus(ListStatus status);

    function initialize(
        string calldata symbol,
        string calldata name,
        address owner,
        address[] calldata defaultOperators,
        int status,
        uint256 granularity,
        address registry1820Addr
    ) external;

    function denyAddress(address who) external;

    function allowAddress(address who) external;

    function switchListStatus(uint8 status) external;

    function authorizeOperator(address operator) external;

    function revokeOperator(address operator) external;

    function setEmergencyPermission(address who) external;

    function setFundingPermission(address who) external;

    function setListsController(address who) external;

    // @dev starts trading by switching _isActive to true
    function emergencyStart() external;

    // @dev stops trading by switching _isActive to false
    function emergencyStop() external;

    // solhint-disable-next-line no-simple-event-func-name
    function fund(address member, uint256 value) external;

    function burn(uint256 amount, bytes calldata data) external;

    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function send(address recipient, uint256 amount, bytes calldata data) external;

    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function granularity() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function defaultOperators() external view returns (address[] memory);

    function getTradingStatus() external view returns (bool);

    function getListStatus() external view returns (ListStatus);

    function isAllowedToSend(address who) external view returns (bool);

    function isOperatorFor(address operator, address holder) external view returns (bool);

    function isMultipleOfGranularity(uint amount) external view returns (bool);

    function decimals() external pure returns (uint256);
}
