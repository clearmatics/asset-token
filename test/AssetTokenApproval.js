// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");

let CONTRACT;

contract("AssetTokenTransfer", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  beforeEach(async () => {
    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(AssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner]
    });

    CONTRACT = PROXY.methods;
  });

  it("Approve: set an approved limit and then make a transfer", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const approvalRes = await CONTRACT.approve(addrProxy, fundVal).send({
      from: addrSender
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    const transferVal = 50;
    const transferRes = await CONTRACT.transferFrom(
      addrSender,
      addrRecipient,
      transferVal
    ).send({ from: addrProxy });

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
      addrSender
    ).call();
    const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const transferEvent = transferRes.events.Transfer;

    const transferEventFrom = transferEvent.returnValues.from;
    const transferEventTo = transferEvent.returnValues.to;
    const transferEventValue = parseInt(transferEvent.returnValues.value);

    assert(transferEvent != null);
    assert.strictEqual(transferEventFrom, addrSender);
    assert.strictEqual(transferEventTo, addrRecipient);
    assert.strictEqual(transferEventValue, transferVal);

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(
      parseInt(totalSupplyFund),
      parseInt(totalSupplyAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceSenderFund) - parseInt(transferVal),
      parseInt(balanceSenderAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund) + parseInt(transferVal),
      parseInt(balanceRecipientAfterTransfer)
    );
  });

  it("Approve: set an approved limit and then make a transfer for more than the current balance", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const approvalRes = await CONTRACT.approve(addrProxy, fundVal).send({
      from: addrSender
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    const transferVal = parseInt(balanceSenderFund) + 50;
    let actualError = null;
    try {
      const transferFail = await CONTRACT.transferFrom(
        addrSender,
        addrRecipient,
        transferVal
      ).send({ from: addrProxy });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
      addrSender
    ).call();
    const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(
      parseInt(totalSupplyFund),
      parseInt(totalSupplyAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceSenderFund),
      parseInt(balanceSenderAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund),
      parseInt(balanceRecipientAfterTransfer)
    );

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert"
    );
  });

  it("Allowance: set an approved limit and check allowance matches", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const approvalRes = await CONTRACT.approve(addrProxy, fundVal).send({
      from: addrSender
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    const transferRes = await CONTRACT.allowance(addrSender, addrProxy).call();

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(parseInt(transferRes), fundVal);
  });

  it("Approve: set an approved limit and then make a transfer to address 0", async () => {
    const addrSender = accounts[2];
    const addrRecipient = 0;
    const addrProxy = accounts[3];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });
    const approvalRes = await CONTRACT.approve(addrProxy, fundVal).send({
      from: addrSender
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

    const transferVal = 50;
    let actualError = null;
    try {
      const transferFail = await CONTRACT.transferFrom(
        addrSender,
        addrRecipient,
        transferVal
      ).send({ from: addrProxy });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
      addrSender
    ).call();

    assert.strictEqual(
      actualError.toString(),
      'Error: invalid address (arg="to", coderType="address", value=0)'
    );

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );

    assert.strictEqual(
      parseInt(totalSupplyFund),
      parseInt(totalSupplyAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceSenderFund),
      parseInt(balanceSenderAfterTransfer)
    );
  });

  it("Approve: set an approved limit, increase it and then make a transfer for more than the new limit", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const approvalVal = 50;
    const approvalRes = await CONTRACT.approve(addrProxy, approvalVal).send({
      from: addrSender
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    let actualError = null;
    try {
      const transferFail = await CONTRACT.transferFrom(
        addrSender,
        addrRecipient,
        fundVal
      ).send({ from: addrProxy });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyTrans = await CONTRACT.totalSupply().call();
    const balanceSenderTrans = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientTrans = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert"
    );
    assert.strictEqual(parseInt(totalSupplyTrans), parseInt(totalSupplyFund));
    assert.strictEqual(
      parseInt(balanceSenderTrans),
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientTrans),
      parseInt(balanceRecipientFund)
    );

    const increaseApprovalRes = await CONTRACT.increaseApproval(
      addrProxy,
      approvalVal
    ).send({ from: addrSender });

    const transferRes = await CONTRACT.transferFrom(
      addrSender,
      addrRecipient,
      fundVal
    ).send({ from: addrProxy });

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
      addrSender
    ).call();
    const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const transferEvent = transferRes.events.Transfer;

    const transferEventFrom = transferEvent.returnValues.from;
    const transferEventTo = transferEvent.returnValues.to;
    const transferEventValue = parseInt(transferEvent.returnValues.value);

    assert(transferEvent != null);
    assert.strictEqual(transferEventFrom, addrSender);
    assert.strictEqual(transferEventTo, addrRecipient);
    assert.strictEqual(transferEventValue, fundVal);

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(
      parseInt(totalSupplyFund),
      parseInt(totalSupplyAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceSenderFund) - fundVal,
      parseInt(balanceSenderAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund) + fundVal,
      parseInt(balanceRecipientAfterTransfer)
    );
  });

  it("Approve: set an approved limit, decrease it and attempt a transfer for more than the new limit", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    const approvalVal = 50;
    const approvalRes = await CONTRACT.approve(addrProxy, approvalVal).send({
      from: addrSender
    });

    const decreaseApprovalRes = await CONTRACT.decreaseApproval(
      addrProxy,
      approvalVal
    ).send({ from: addrSender });

    let actualError = null;
    try {
      const transferFail = await CONTRACT.transferFrom(
        addrSender,
        addrRecipient,
        fundVal
      ).send({ from: addrProxy });
    } catch (error) {
      actualError = error;
    }

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert"
    );

    const totalSupplyTrans = await CONTRACT.totalSupply().call();
    const balanceSenderTrans = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientTrans = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(parseInt(totalSupplyFund), parseInt(totalSupplyTrans));
    assert.strictEqual(
      parseInt(balanceSenderFund),
      parseInt(balanceSenderTrans)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund),
      parseInt(balanceRecipientTrans)
    );
  });

  it("Approve: set an approved limit, decrease more than the current limit and attempt a transfer for more than the new limit", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];
    const addrProxy = accounts[4];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    const fundVal = 100;
    const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
      from: addrOwner
    });

    const totalSupplyFund = await CONTRACT.totalSupply().call();
    const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientFund = await CONTRACT.balanceOf(addrRecipient).call();

    const approvalVal = 50;
    const approvalRes = await CONTRACT.approve(addrProxy, approvalVal).send({
      from: addrSender
    });

    const newApprovalVal = approvalVal + 10;
    const decreaseApprovalRes = await CONTRACT.decreaseApproval(
      addrProxy,
      newApprovalVal
    ).send({ from: addrSender });

    let actualError = null;
    try {
      const transferFail = await CONTRACT.transferFrom(
        addrSender,
        addrRecipient,
        fundVal
      ).send({ from: addrProxy });
    } catch (error) {
      actualError = error;
    }

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert"
    );

    const totalSupplyTrans = await CONTRACT.totalSupply().call();
    const balanceSenderTrans = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientTrans = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    assert.strictEqual(
      parseInt(totalSupplyStart) + fundVal,
      parseInt(totalSupplyFund)
    );
    assert.strictEqual(
      parseInt(balanceSenderStart) + fundVal,
      parseInt(balanceSenderFund)
    );
    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientFund)
    );

    assert.strictEqual(parseInt(totalSupplyFund), parseInt(totalSupplyTrans));
    assert.strictEqual(
      parseInt(balanceSenderFund),
      parseInt(balanceSenderTrans)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund),
      parseInt(balanceRecipientTrans)
    );
  });
});
