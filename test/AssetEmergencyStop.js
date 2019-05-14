// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetEmergencyStop', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLP", "Asset Token", { from: addrOwner });
    });

    it('Emergency Switch: Attempt to Fund when trading is deactivated', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        await CONTRACT.emergencyStop({from: addrOwner});
        const status = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatus = status.receipt.logs
        assert.equal(tradeStatus[0].args.balance, false);

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
        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert Contract emergency stop is activated -- Reason given: Contract emergency stop is activated.");
    });

    it('Emergency Switch: Attempt to Defund when trading is deactivated', async () => {
        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrOwner);

        await CONTRACT.emergencyStop({ from: addrOwner });
        const status = await CONTRACT.getTradingStatus({ from: addrOwner });
        const tradeStatus = status.receipt.logs
        assert.equal(tradeStatus[0].args.balance, false);

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
        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert Contract emergency stop is activated -- Reason given: Contract emergency stop is activated.");
    });

    it('Emergency Switch: Attempt to transfer when trading is deactivated', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        await CONTRACT.emergencyStop({ from: addrOwner });
        const status = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatus = status.receipt.logs
        assert.equal(tradeStatus[0].args.balance, false);

        let actualError = null;
        try {
            const transferVal = 50;
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert Contract emergency stop is activated -- Reason given: Contract emergency stop is activated.");

    });

    it('Emergency Switch: Deactivate trading attempt transfer, activate trading attempt transfer', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const transferVal = 50

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        await CONTRACT.emergencyStop({ from: addrOwner });
        const switchStatusbefore = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatusBefore = switchStatusbefore.receipt.logs
        assert.equal(tradeStatus[0].args.balance, false);

        let actualError = null;
        try {
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert Contract emergency stop is activated -- Reason given: Contract emergency stop is activated.");

        await CONTRACT.emergencyStart({ from: addrOwner });
        const switchStatusAfter = await CONTRACT.getTradingStatus({ from: addrOwner });
        tradeStatusAfter = switchStatusAfter.receipt.logs
        assert.equal(tradeStatus[0].args.balance, false);

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceSenderAfter = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        const fundValAfter = 100;
        const fundResAfter = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFundAfter = await CONTRACT.totalSupply.call();
        const balanceSenderFundAfter = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFundAfter = await CONTRACT.balanceOf.call(addrRecipient);

        actualError = null;
        try {
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterSwitch = await CONTRACT.totalSupply.call();
        const balanceSenderAfterSwitch = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterSwitch = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyAfter.toNumber() + fundVal, totalSupplyFundAfter.toNumber());
        assert.strictEqual(balanceSenderAfter.toNumber() + fundVal, balanceSenderFundAfter.toNumber());
        assert.strictEqual(balanceRecipientAfter.toNumber(), balanceRecipientFundAfter.toNumber());

        assert.strictEqual(totalSupplyFundAfter.toNumber(), totalSupplyAfterSwitch.toNumber());
        assert.strictEqual(balanceSenderFundAfter.toNumber(), balanceSenderAfterSwitch.toNumber() + transferVal);
        assert.strictEqual(balanceRecipientFundAfter.toNumber(), balanceRecipientAfterSwitch.toNumber() - transferVal);

        assert.strictEqual(actualError,null);

    });

    it("Emergency Stop Delegation: Delegated account is able to stop an operation", async () => {
      const delegated = accounts[3];

      await CONTRACT.setEmergencyPermission(delegated, {from: addrOwner});

      await CONTRACT.emergencyStop({ from: delegated });
      const status = await CONTRACT.getTradingStatus({ from: addrOwner });
      tradeStatus = status.receipt.logs
      assert.equal(tradeStatus[0].args.balance, false);

    })

    it("Emergency Stop Delegation: Permission is correctly revoked", async () => {
      const delegated = accounts[3];

      await CONTRACT.setEmergencyPermission(delegated, {from: addrOwner});
      //the second time will revoke his permission
      await CONTRACT.setEmergencyPermission(delegated, {from: addrOwner});

      try{
          await CONTRACT.emergencyStop({ from: delegated });
      } catch (error) {
        assert.strictEqual(error.toString(),"Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this -- Reason given: This account is not allowed to do this.");
      }

    })

});
