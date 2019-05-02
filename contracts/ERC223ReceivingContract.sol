// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.5.0;


contract ERC223ReceivingContract {
    function tokenFallback(address from, uint value, bytes calldata data) external;
}
