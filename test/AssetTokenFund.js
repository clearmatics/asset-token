// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken");

let CONTRACT;

contract("AssetTokenFund", accounts => {
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

  /*
  it("fund: Fund an account", async () => {
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

    const totalSupplyAfter = await CONTRACT.totalSupply().call();
    const balanceRecipientAfter = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert(fundEvent != null);
    assert.strictEqual(fundVal, fundEventVal);
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      fundEventBalance
    );
    assert.strictEqual(
      parseInt(totalSupplyBefore) + fundVal,
      parseInt(totalSupplyAfter)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(balanceRecipientAfter)
    );
  });
  */
  it("fund: Attempt to Fund when not the contract owner nor delegated one", async () => {
    const addrRecipient = accounts[2];

    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    let actualError = null;
    try {
      const fundVal = 100;
      const fundRes = await CONTRACT.fund(addrRecipient, fundVal).send({
        from: addrRecipient
      });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfter = await CONTRACT.totalSupply().call();
    const balanceRecipientAfter = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(parseInt(totalSupplyBefore), parseInt(totalSupplyAfter));
    assert.strictEqual(
      parseInt(balanceRecipientBefore),
      parseInt(balanceRecipientAfter)
    );
    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
    );
  });

  it("fund: Attempt to Fund the contract owner", async () => {
    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(addrOwner).call();

    let actualError = null;
    try {
      const fundVal = 100;
      const fundRes = await CONTRACT.fund(addrOwner, fundVal).send({
        from: addrOwner
      });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfter = await CONTRACT.totalSupply().call();
    const balanceRecipientAfter = await CONTRACT.balanceOf(addrOwner).call();

    assert.strictEqual(parseInt(totalSupplyBefore), parseInt(totalSupplyAfter));
    assert.strictEqual(
      parseInt(balanceRecipientBefore),
      parseInt(balanceRecipientAfter)
    );
    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
    );
  });

  /*
  it("Delegate fund operation: Delegated account is able to fund", async () => {
    const delegate = accounts[2];
    const addrRecipient = accounts[3];

    await CONTRACT.setFundingPermission(delegate).send({ from: addrOwner });

    const totalSupplyBefore = await CONTRACT.totalSupply().call();
    const balanceRecipientBefore = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;

    const fundRes = await CONTRACT.fund(addrRecipient, fundVal).send({
      from: delegate
    });

    const fundEvent = fundRes.events.Fund;
    const fundEventVal = parseInt(fundEvent.returnValues.value);
    const fundEventBalance = parseInt(fundEvent.returnValues.balance);

    const totalSupplyAfter = await CONTRACT.totalSupply().call();
    const balanceRecipientAfter = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert(fundEvent != null);
    assert.strictEqual(fundVal, fundEventVal);
    assert.strictEqual(
      parseInt(totalSupplyBefore) + fundVal,
      parseInt(totalSupplyAfter)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(balanceRecipientAfter)
    );
    assert.strictEqual(
      parseInt(balanceRecipientBefore) + fundVal,
      parseInt(fundEventBalance)
    );
  });
  */

  it("Delegate Fund Operation: Revoked account is not able to fund", async () => {
    const delegate = accounts[2];
    const addrRecipient = accounts[3];
    const fundVal = 100;
    let error = null;

    await CONTRACT.setFundingPermission(delegate).send({ from: addrOwner });
    await CONTRACT.revokeFundingPermission().send({ from: addrOwner });

    try {
      await CONTRACT.fund(addrRecipient, fundVal).send({ from: delegate });
    } catch (err) {
      error = err;
    }

    assert.strictEqual(
      error.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
    );
  });

  it("Delegate Fund Operation: Owner is not able to fund once has delegated", async () => {
    const delegate = accounts[2];
    const addrRecipient = accounts[3];
    const fundVal = 100;
    let error = null;
    await CONTRACT.setFundingPermission(delegate).send({ from: addrOwner });

    try {
      await CONTRACT.fund(addrRecipient, fundVal).send({ from: addrOwner });
    } catch (err) {
      error = err;
    }

    assert.strictEqual(
      error.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
    );
  });
});
