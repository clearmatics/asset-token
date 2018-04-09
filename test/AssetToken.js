const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetToken', (accounts) => {
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

    it('fund: Fund an account', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientAfter.toNumber());
    });

    it ('fund: FundEvent is triggered', async () => {
        const addrRecipient = accounts[1];

        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const balanceRecipientAfter = await CONTRACT.balanceOf.call(addrRecipient);

        const fundEvent = fundRes.logs.filter((log) => log.event === 'FundEvent')[0]
        const fundEventVal = fundEvent.args.value.toNumber()
        const fundEventBalance = fundEvent.args.balance.toNumber()

        assert(fundEvent != null)
        assert.strictEqual(fundVal, fundEventVal)
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, fundEventBalance)
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundEventVal, balanceRecipientAfter.toNumber())
    });

    it('fund: Attempt to Fund when not the contract owner', async () => {
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
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
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
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
    });

    it('defund: Defund an account', async () => {
        const addrRecipient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const totalSupplyFunded = await CONTRACT.totalSupply.call();
        const balanceRecipientFunded = await CONTRACT.balanceOf.call(addrRecipient);

        const defundVal = 50;
        const defundRes = await CONTRACT.defund(defundVal, { from: addrRecipient });

        const totalSupplyDefunded = await CONTRACT.totalSupply.call();
        const balanceRecipientDefunded = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyFunded.toNumber());
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, balanceRecipientFunded.toNumber());

        assert.strictEqual(totalSupplyFunded.toNumber() - defundVal, totalSupplyDefunded.toNumber());
        assert.strictEqual(balanceRecipientFunded.toNumber() - defundVal, balanceRecipientDefunded.toNumber());
    });

    it ('defund: DefundEvent is triggered', async () => {
        const addrRecipient = accounts[1];

        const balanceRecipientBefore = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, { from: addrOwner });

        const balanceRecipientFunded = await CONTRACT.balanceOf.call(addrRecipient);

        const defundVal = 50;
        const defundRes = await CONTRACT.defund(defundVal, { from: addrRecipient });

        const balanceRecipientDefunded = await CONTRACT.balanceOf.call(addrRecipient);

        const fundEvent = fundRes.logs.filter((log) => log.event === 'FundEvent')[0]
        const fundEventVal = fundEvent.args.value.toNumber()
        const fundEventBalance = fundEvent.args.balance.toNumber()

        const defundEvent = defundRes.logs.filter((log) => log.event === 'DefundEvent')[0]
        const defundEventVal = defundEvent.args.value.toNumber()
        const defundEventBalance = defundEvent.args.balance.toNumber()

        assert(fundEvent != null)
        assert.strictEqual(fundVal, fundEventVal)
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundVal, fundEventBalance)
        assert.strictEqual(balanceRecipientBefore.toNumber() + fundEventVal, balanceRecipientFunded.toNumber())

        assert(defundEvent != null)
        assert.strictEqual(defundVal, defundEventVal)
        assert.strictEqual(balanceRecipientFunded.toNumber() - defundVal, defundEventBalance)
        assert.strictEqual(balanceRecipientFunded.toNumber() - defundEventVal, balanceRecipientDefunded.toNumber())
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

    it('transfer: Transfer tokens without any extra data field', async () => {
        const addrSender = accounts[1];

        const fundVal = 1;
        CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

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
