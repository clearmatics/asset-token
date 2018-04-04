const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetToken', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: accounts[0] });
    });

    it('Check the name of the token', async () => {
        const actualName = await CONTRACT.name.call();
	const expectedName = "Asset Token";

        assert.strictEqual(actualName, expectedName);
    });

    it('Check the tokens symbol', async () => {
        const actualSymbol = await CONTRACT.symbol.call();
	const expectedSymbol = "CLR";

        assert.strictEqual(actualSymbol, expectedSymbol);
    });

    it('Check the number of decimal place in the tokens', async () => {
        const actualDecimals = await CONTRACT.decimals.call();
	const expectedDecimals = 3;

        assert.strictEqual(actualDecimals.toNumber(), expectedDecimals);
    });

    it('Transfer tokens without any extra data field', async () => {
        const addrSender = addrOwner;

        const fundVal = 1;
        CONTRACT.fund(addrSender, fundVal, { from: addrSender });

        const totalSupply = await CONTRACT.totalSupply.call();
        let balanceOwner = await CONTRACT.balanceOf.call(addrOwner);
        assert.strictEqual(totalSupply.toNumber(),balanceOwner.toNumber());

        const addrRecepient = accounts[1];
        const transferVal = 1;
        const transferRes = await CONTRACT.transfer(addrRecepient, transferVal, { from: addrSender });
        const balanceRecepient = await CONTRACT.balanceOf.call(addrRecepient);
        balanceOwner = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(balanceRecepient.plus(balanceOwner).toNumber(),totalSupply.toNumber());

        const transferLog = transferRes.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, addrSender);
        assert.strictEqual(transferLog.args.to, addrRecepient);
        assert.strictEqual(transferLog.args.value.toString(), balanceRecepient.toString());
    });

    it('Fund an account', async () => {
        const addrRecepient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecepientBefore = await CONTRACT.balanceOf.call(addrRecepient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecepient, fundVal, { from: addrOwner });

        const totalSupplyAfter = await CONTRACT.totalSupply.call();
        const balanceRecepientAfter = await CONTRACT.balanceOf.call(addrRecepient);

        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyAfter.toNumber());
        assert.strictEqual(balanceRecepientBefore.toNumber() + fundVal, balanceRecepientAfter.toNumber());
    });

    it('Defund an account', async () => {
        const addrRecepient = accounts[1];

        const totalSupplyBefore = await CONTRACT.totalSupply.call();
        const balanceRecepientBefore = await CONTRACT.balanceOf.call(addrRecepient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecepient, fundVal, { from: addrOwner });

        const totalSupplyFunded = await CONTRACT.totalSupply.call();
        const balanceRecepientFunded = await CONTRACT.balanceOf.call(addrRecepient);

        const defundVal = 50;
        const defundRes = await CONTRACT.defund(addrRecepient, defundVal, { from: addrOwner });

        const totalSupplyDefunded = await CONTRACT.totalSupply.call();
        const balanceRecepientDefunded = await CONTRACT.balanceOf.call(addrRecepient);

        assert.strictEqual(totalSupplyBefore.toNumber() + fundVal, totalSupplyFunded.toNumber());
        assert.strictEqual(balanceRecepientBefore.toNumber() + fundVal, balanceRecepientFunded.toNumber());

        assert.strictEqual(totalSupplyFunded.toNumber() - defundVal, totalSupplyDefunded.toNumber());
        assert.strictEqual(balanceRecepientFunded.toNumber() - defundVal, balanceRecepientDefunded.toNumber());
    });
});
