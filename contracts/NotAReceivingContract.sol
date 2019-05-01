// Copyright (c) 2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.5.0;


contract NotAReceivingContract {
    event Created();
    event Called();

    constructor() public {
        emit Created();
    }

    function notATokenFallback() public {
        emit Called();
    }

}

