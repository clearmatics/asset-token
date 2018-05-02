// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetPanicButton', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLP", "Asset Token", { from: addrOwner });
    });

    it('Panic Button: Attempt to Fund when trading is deactivated', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        await CONTRACT.switchTrading({from: addrOwner});
        const status = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatus = status.receipt.logs
        assert.equal(tradeStatus[0].data, 0);

        let actualError = null;
        try {
            const fundVal = 100;
            const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyBefore.toNumber(), totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber(), balanceRecipientAfter.toNumber());
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
    });

    it('Panic Button: Attempt to Defund the contract owner', async () => {
        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrOwner);

        await CONTRACT.switchTrading({ from: addrOwner });
        const status = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatus = status.receipt.logs
        assert.equal(tradeStatus[0].data, 0);

        let actualError = null;
        try {
            const defundVal = 50;
            const defundRes = await CONTRACT.defund(defundVal, { from: addrOwner });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyDefunded = await CONTRACT.totalSupply.call();
        const balanceRecipientDefunded = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyBefore.toNumber(), totalSupplyDefunded.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber(), balanceRecipientDefunded.toNumber());
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
    });


});
