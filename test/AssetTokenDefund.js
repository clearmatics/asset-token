// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenDefund', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('defund: Defund more tokens than in the account', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const totalSupplyFunded = await CONTRACT.totalSupply.call();
        const balanceRecipientFunded = await CONTRACT.balanceOf.call(addrRecipient);


        let actualError = null;
        try {
            const defundVal = balanceRecipientFunded.toNumber() + 50;
            const defundRes = await CONTRACT.defund(defundVal, { from: addrRecipient });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyDefunded = await CONTRACT.totalSupply.call();
        const balanceRecipientDefunded = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyFunded.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientFunded.toNumber());

        assert.strictEqual(totalSupplyFunded.toNumber(), totalSupplyDefunded.toNumber());
        assert.strictEqual(balanceRecipientFunded.toNumber() , balanceRecipientDefunded.toNumber());
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
    });

    it('defund: Defund an account', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const fundEvent = fundRes.logs.filter((log) => log.event === 'Fund')[0]
        const fundEventVal = fundEvent.args.value.toNumber()
        const fundEventBalance = fundEvent.args.balance.toNumber()

        const totalSupplyFunded = await CONTRACT.totalSupply.call();
        const balanceRecipientFunded = await CONTRACT.balanceOf.call(addrRecipient);

        const defundVal = 50;
        const defundRes = await CONTRACT.defund(defundVal, { from: addrRecipient });

        const defundEvent = defundRes.logs.filter((log) => log.event === 'Defund')[0]
        const defundEventVal = defundEvent.args.value.toNumber()
        const defundEventBalance = defundEvent.args.balance.toNumber()

        const totalSupplyDefunded = await CONTRACT.totalSupply.call();
        const balanceRecipientDefunded = await CONTRACT.balanceOf.call(addrRecipient);

        assert(fundEvent != null)
        assert.strictEqual(fundVal, fundEventVal)
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, fundEventBalance)
        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyFunded.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientFunded.toNumber());

        assert(defundEvent != null)
        assert.strictEqual(defundVal, defundEventVal)
        assert.strictEqual(balanceRecipientFunded.toNumber() - defundVal, defundEventBalance)
        assert.strictEqual(totalSupplyFunded.toNumber() - defundVal, totalSupplyDefunded.toNumber());
        assert.strictEqual(balanceRecipientFunded.toNumber() - defundVal, balanceRecipientDefunded.toNumber());
    });

    it('defund: Attempt to Defund the contract owner', async () => {
        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrOwner);

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
