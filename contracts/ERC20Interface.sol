// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.5.0;


interface ERC20Interface {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
