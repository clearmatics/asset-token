// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken");

let CONTRACT;

contract("AssetTokenDefund", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  beforeEach(async () => {
    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(UpgradeableAssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner]
    });

    CONTRACT = PROXY.methods;
  });

  it("defund: Defund more tokens than in the account", async () => {
    const addrRecipient = accounts[2];

    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrRecipient, fundVal).send({
      from: addrOwner
    });

    const totalSupplyFunded = await CONTRACT.totalSupply().call();
    const balanceRecipientFunded = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    let actualError = null;
    try {
      const defundVal = parseInt(balanceRecipientFunded) + 50;
      const defundRes = await CONTRACT.defund(defundVal).send({
        from: addrRecipient
      });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyDefunded = await CONTRACT.totalSupply().call();
    const balanceRecipientDefunded = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(
      parseInt(totalSupplyBefore) + fundVal,
      parseInt(totalSupplyFunded)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(balanceRecipientFunded)
    );

    assert.strictEqual(
      parseInt(totalSupplyFunded),
      parseInt(totalSupplyDefunded)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFunded),
      parseInt(balanceRecipientDefunded)
    );
    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert You must have sufficent balance to perform this operation"
    );
  });

  it("defund: Defund an account", async () => {
    const addrRecipient = accounts[2];

    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrRecipient, fundVal).send({
      from: addrOwner
    });

    const fundEvent = fundRes.events.Fund;
    const fundEventVal = parseInt(fundEvent.returnValues.value);
    const fundEventBalance = parseInt(fundEvent.returnValues.balance);

    const totalSupplyFunded = await CONTRACT.totalSupply().call();
    const balanceRecipientFunded = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const defundVal = 50;
    const defundRes = await CONTRACT.defund(defundVal).send({
      from: addrRecipient
    });

    const defundEvent = defundRes.events.Defund;
    const defundEventVal = parseInt(defundEvent.returnValues.value);
    const defundEventBalance = parseInt(defundEvent.returnValues.balance);

    const totalSupplyDefunded = await CONTRACT.totalSupply().call();
    const balanceRecipientDefunded = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert(fundEvent != null);
    assert.strictEqual(fundVal, fundEventVal);
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(fundEventBalance)
    );
    assert.strictEqual(
      parseInt(totalSupplyBefore) + fundVal,
      parseInt(totalSupplyFunded)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(balanceRecipientFunded)
    );

    assert(defundEvent != null);
    assert.strictEqual(defundVal, defundEventVal);
    assert.strictEqual(
      parseInt(balanceRecipientFunded) - defundVal,
      parseInt(defundEventBalance)
    );
    assert.strictEqual(
      parseInt(totalSupplyFunded) - defundVal,
      parseInt(totalSupplyDefunded)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFunded) - defundVal,
      parseInt(balanceRecipientDefunded)
    );
  });

  it("defund: Attempt to Defund the contract owner", async () => {
    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(addrOwner).call();

    let actualError = null;
    try {
      const defundVal = 50;
      const defundRes = await CONTRACT.defund(defundVal).send({
        from: addrOwner
      });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyDefunded = await CONTRACT.totalSupply().call();
    const balanceRecipientDefunded = await CONTRACT.balanceOf(addrOwner).call();

    assert.strictEqual(
      parseInt(totalSupplyBefore),
      parseInt(totalSupplyDefunded)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore),
      parseInt(balanceRecipientDefunded)
    );
    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
    );
  });
});
