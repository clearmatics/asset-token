// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.5.0;


contract ERC223Interface {
    function name() public view returns (string memory);
    function symbol() public view returns (string memory);
    function decimals() public view returns (uint8);
    function totalSupply() public view returns (uint256);
    function balanceOf(address addr) public view returns (uint);

    function transfer(address to, uint value) public returns (bool);
    function transfer(address to, uint value, bytes memory data) public returns (bool);
    function transfer(address to, uint value, bytes memory data, string memory customFallback) public returns (bool);

    // solhint-disable-next-line no-simple-event-func-name
    event Transfer(address from, address to, uint value, bytes data);
}
