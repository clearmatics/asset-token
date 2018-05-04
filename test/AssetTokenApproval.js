// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenTransfer', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('Approve: set an approved limit and then make a transfer', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const approvalRes = await CONTRACT.approve(addrProxy, fundVal, { from: addrSender });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = 50;
        const transferRes = await CONTRACT.transferFrom(addrSender, addrRecipient, transferVal, { from: addrProxy });

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
        const transferEventFrom = transferEvent.args.from;
        const transferEventTo = transferEvent.args.to;
        const transferEventValue = transferEvent.args.value.toNumber()

        assert(transferEvent != null);
        assert.strictEqual(transferEventFrom, addrSender);
        assert.strictEqual(transferEventTo, addrRecipient);
        assert.strictEqual(transferEventValue, transferVal);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber() - transferVal, balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber() + transferVal, balanceRecipientAfterTransfer.toNumber());
    });

    it('Approve: set an approved limit and then make a transfer for more than the current balance', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const approvalRes = await CONTRACT.approve(addrProxy, fundVal, { from: addrSender });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = balanceSenderFund.toNumber() + 50;
        let actualError = null;
        try {
            const transferFail = await CONTRACT.transferFrom(addrSender, addrRecipient, transferVal, { from: addrProxy });
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

        assert(actualError.toString() == "Error: VM Exception while processing transaction: revert");
    });

    it('Allowance: set an approved limit and check allowance matches', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const approvalRes = await CONTRACT.approve(addrProxy, fundVal, { from: addrSender });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferRes = await CONTRACT.allowance(addrSender, addrProxy);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(transferRes.toNumber(), fundVal);
    });


    it('Approve: set an approved limit and then make a transfer to address 0', async () => {
        const addrSender = accounts[1];
        const addrRecipient = 0;
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const approvalRes = await CONTRACT.approve(addrProxy, fundVal, { from: addrSender });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = 50;
        let actualError = null;
        try {
            const transferFail = await CONTRACT.transferFrom(addrSender, addrRecipient, transferVal, { from: addrProxy });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert(actualError.toString() == "Error: VM Exception while processing transaction: revert");

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());
    });

    it('Approve: set an approved limit, increase it and then make a transfer for more than the new limit', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const approvalVal = 50;
        const approvalRes = await CONTRACT.approve(addrProxy, approvalVal, { from: addrSender });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const transferFail = await CONTRACT.transferFrom(addrSender, addrRecipient, fundVal, { from: addrProxy });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyTrans = await CONTRACT.totalSupply.call();
        const balanceSenderTrans = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientTrans = await CONTRACT.balanceOf.call(addrRecipient);

        assert(actualError.toString() == "Error: VM Exception while processing transaction: revert");
        assert.strictEqual(totalSupplyTrans.toNumber(), totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderTrans.toNumber(), balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientTrans.toNumber(), balanceRecipientFund.toNumber());

        const increaseApprovalRes = await CONTRACT.increaseApproval(addrProxy, approvalVal, { from: addrSender });

        const transferRes = await CONTRACT.transferFrom(addrSender, addrRecipient, fundVal, { from: addrProxy });

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
        const transferEventFrom = transferEvent.args.from;
        const transferEventTo = transferEvent.args.to;
        const transferEventValue = transferEvent.args.value.toNumber()

        assert(transferEvent != null);
        assert.strictEqual(transferEventFrom, addrSender);
        assert.strictEqual(transferEventTo, addrRecipient);
        assert.strictEqual(transferEventValue, fundVal);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber() - fundVal, balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber() + fundVal, balanceRecipientAfterTransfer.toNumber());
    });

    it('Approve: set an approved limit, decrease it and attempt a transfer for more than the new limit', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];
        const addrProxy = accounts[3];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const approvalVal = 50;
        const approvalRes = await CONTRACT.approve(addrProxy, fundVal, { from: addrSender });

        const decreaseApprovalRes = await CONTRACT.decreaseApproval(addrProxy, approvalVal, { from: addrSender });

        let actualError = null;
        try {
          const transferFail = await CONTRACT.transferFrom(addrSender, addrRecipient, fundVal, { from: addrProxy });
        } catch (error) {
          actualError = error;
        }
        assert(actualError.toString() == "Error: VM Exception while processing transaction: revert");

        const totalSupplyTrans = await CONTRACT.totalSupply.call();
        const balanceSenderTrans = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientTrans = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyTrans.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderTrans.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientTrans.toNumber());
    });

});
