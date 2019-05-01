// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.5.0;


interface ERC223Interface {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value, bytes calldata data) external returns (bool);
    function transfer(address to, uint256 value, bytes calldata data, string calldata fallback) external returns (bool);

    // solhint-disable-next-line no-simple-event-func-name
    event Transfer(address from, address to, uint256 value, bytes data);
}
