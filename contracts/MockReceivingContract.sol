// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.4.23;

import "./ERC223ReceivingContract.sol";


contract MockReceivingContract is ERC223ReceivingContract {

    event Called(address from, uint value, bytes data);

    constructor() public {
    }

    function tokenFallback(address from, uint value, bytes data) public {
	emit Called(from, value, data);
    }

}
