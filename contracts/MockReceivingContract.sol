// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.4.24;

import "./ERC223ReceivingContract.sol";


contract MockReceivingContract is ERC223ReceivingContract {

    event Created();
    event Called(address from, uint value, bytes data);

    constructor() public {
        emit Created();
    }

    function tokenFallback(address from, uint value, bytes data) public {
        emit Called(from, value, data);
    }

}
