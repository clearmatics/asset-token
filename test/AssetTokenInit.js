// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenInit', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('name: Check the name of the token', async () => {
        const actualName = await CONTRACT.name.call();
        const expectedName = "Asset Token";

        assert.strictEqual(actualName, expectedName);
    });

    it('symbol: Check the tokens symbol', async () => {
        const actualSymbol = await CONTRACT.symbol.call();
        const expectedSymbol = "CLR";

        assert.strictEqual(actualSymbol, expectedSymbol);
    });

    it('decimals: Check the number of decimal place in the tokens', async () => {
        const actualDecimals = await CONTRACT.decimals.call();
        const expectedDecimals = 3;

        assert.strictEqual(actualDecimals.toNumber(), expectedDecimals);
    });

    it('default: Attempt to send Eth to the contract', async () => {
        const weiToSend = web3.utils.toWei("1","ether");

        let actualError = null;
        try {
            const result = await CONTRACT.sendTransaction({value:weiToSend});
        } catch (error) {
            actualError = error;
        }

        assert.strictEqual(actualError.toString(), "Error: Returned error: VM Exception while processing transaction: revert -- Reason given: This contract does not support ETH.");
    });
});
