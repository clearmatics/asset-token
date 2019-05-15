// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenFund', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLP", "Asset Token", { from: addrOwner });
    });

    it('fund: Fund an account', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const fundEvent = fundRes.logs.filter((log) => log.event === 'Fund')[0];
        const fundEventVal = fundEvent.args.value.toNumber();
        const fundEventBalance = fundEvent.args.balance.toNumber();

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        assert(fundEvent != null);
        assert.strictEqual(fundVal, fundEventVal);
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, fundEventBalance);
        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientAfter.toNumber());
    });

    it('fund: Attempt to Fund when not the contract owner nor delegated one', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const fundVal = 100;
            const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrRecipient });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyBefore.toNumber(), totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber(), balanceRecipientAfter.toNumber());
        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this -- Reason given: This account is not allowed to do this.");
    });

    it('fund: Attempt to Fund the contract owner', async () => {
        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrOwner);

        let actualError = null;
        try {
            const fundVal = 100;
            const fundRes = await CONTRACT.fund(addrOwner, fundVal, { from: addrOwner });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyBefore.toNumber(), totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber(), balanceRecipientAfter.toNumber());
        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation -- Reason given: The contract owner can not perform this operation.");
    });

    it("Delegate fund operation: Delegated account is able to fund", async () => {
        const delegate = accounts[1];
        const addrRecipient = accounts[2];

        await CONTRACT.setFundingPermission(delegate, {from:addrOwner});

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: delegate });

        const fundEvent = fundRes.logs.filter((log) => log.event === 'Fund')[0];
        const fundEventVal = fundEvent.args.value.toNumber();
        const fundEventBalance = fundEvent.args.balance.toNumber();

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        assert(fundEvent != null);
        assert.strictEqual(fundVal, fundEventVal);
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, fundEventBalance);
        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientAfter.toNumber());
    })

    it("Delegate Fund Operation: Revoked account is not able to fund", async() => {
      const delegate = accounts[1];
      const addrRecipient = accounts[2];
      const fundVal = 100;
      let error = null;

      await CONTRACT.setFundingPermission(delegate, {from:addrOwner});
      await CONTRACT.revokeFundingPermission({from:addrOwner});

      try{
        await CONTRACT.fund(addrRecipient, fundVal, {from:delegate});
      }catch (err){
        error = err;
      }

      assert.strictEqual(error.toString(),"Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this -- Reason given: This account is not allowed to do this.");

    })

    it("Delegate Fund Operation: Owner is not able to fund once has delegated", async () => {
      const delegate = accounts[1];
      const addrRecipient = accounts[2];
      const fundVal = 100;
      let error = null;
      await CONTRACT.setFundingPermission(delegate, {from:addrOwner});

      try{
        await CONTRACT.fund(addrRecipient, fundVal, {from:addrOwner});
      }catch (err){
        error = err;
      }

      assert.strictEqual(error.toString(),"Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this -- Reason given: This account is not allowed to do this.");



    })


});
