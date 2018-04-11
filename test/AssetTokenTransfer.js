const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenTransfer', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('transfer: Transfer more tokens than in the account', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 1;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const transferVal = balanceSenderFund.toNumber() + 50;
            const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());
    });

    it('transfer: Transfer tokens without any extra data field', async () => {
        const addrSender = accounts[1];

        const fundVal = 1;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupply = await CONTRACT.totalSupply.call();
        let balanceSender = await CONTRACT.balanceOf.call(addrSender);
        assert.strictEqual(totalSupply.toNumber(),balanceSender.toNumber());

        const addrRecipient = accounts[2];
        const transferVal = 1;
        const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });
        const balanceRecipient = await CONTRACT.balanceOf.call(addrRecipient);
        balanceOwner = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(balanceRecipient.plus(balanceOwner).toNumber(),totalSupply.toNumber());

        const transferLog = transferRes.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, addrSender);
        assert.strictEqual(transferLog.args.to, addrRecipient);
        assert.strictEqual(transferLog.args.value.toString(), balanceRecipient.toString());
    });
});
