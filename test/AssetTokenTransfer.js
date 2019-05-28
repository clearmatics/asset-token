// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+
const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken");
const MockReceivingContract = artifacts.require(`MockReceivingContract`);
const NotAReceivingContract = artifacts.require(`NotAReceivingContract`);

let CONTRACT;

contract("AssetTokenTransfer", accounts => {
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

  it("Contract Owner cannot be the sender in a transfer", async () => {
    const addrSender = addrOwner;
    const addrRecipient = accounts[2];

    const totalSupplyStart = await CONTRACT.totalSupply().call();
    const balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
    const balanceRecipientStart = await CONTRACT.balanceOf(
      addrRecipient
    ).call();

    let actualError = null;
    try {
      const transferVal = 50;
      const transferRes = await CONTRACT.transferNoData(
        addrRecipient,
        transferVal
      ).send({ from: addrSender });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
      addrOwner
    ).call();

    assert.strictEqual(
      parseInt(totalSupplyStart),
      parseInt(totalSupplyAfterTransfer)
    );

    assert.strictEqual(
      parseInt(balanceRecipientStart),
      parseInt(balanceRecipientAfterTransfer)
    );

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
    );
  });

  /*
  it("Can transfer tokens from External Owned Account(EOA) to EOA", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];

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

    const transferVal = 50;
    const transferRes = await CONTRACT.transferNoData(
      addrRecipient,
      transferVal
    ).send({ from: addrSender });

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
      parseInt(balanceSenderFund) - transferVal,
      parseInt(balanceSenderAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund) + transferVal,
      parseInt(balanceRecipientAfterTransfer)
    );
  });

  it("Cannot transfer more tokens than in the account", async () => {
    const addrSender = accounts[2];
    const addrRecipient = accounts[3];

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

    let actualError = null;
    try {
      const transferVal = parseInt(balanceSenderFund) + 50;
      const transferRes = await CONTRACT.transferNoData(
        addrRecipient,
        transferVal
      ).send({ from: addrSender });
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
      "Error: Returned error: VM Exception while processing transaction: revert You must have sufficent balance to perform this operation"
    );
  });



  it("Contract Owner cannot be the recipient in a transfer", async () => {
    const addrSender = accounts[2];
    const addrRecipient = addrOwner;

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

    let actualError = null;
    try {
      const transferVal = 50;
      const transferRes = await CONTRACT.transferNoData(
        addrRecipient,
        transferVal
      ).send({ from: addrSender });
    } catch (error) {
      actualError = error;
    }

    const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
    const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
      addrSender
    ).call();
    const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
      addrOwner
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
      "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
    );
  });

  it("Can transfer tokens from External Owned Account(EOA) to a contract", async () => {
    let mockReceivingContract = await MockReceivingContract.new({
      from: addrOwner
    });

    const addrSender = accounts[2];
    const addrRecipient = mockReceivingContract.address;

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

    const transferVal = 50;
    const transferRes = await CONTRACT.transferNoData(
      addrRecipient,
      transferVal
    ).send({ from: addrSender });

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
      parseInt(balanceSenderFund) - transferVal,
      parseInt(balanceSenderAfterTransfer)
    );
    assert.strictEqual(
      parseInt(balanceRecipientFund) + transferVal,
      parseInt(balanceRecipientAfterTransfer)
    );

    const logs = await mockReceivingContract.getPastEvents("Called", {
      fromBlock: 0,
      toBlock: "latest"
    });
    assert.strictEqual(logs[0].event, "Called");
    assert.strictEqual(logs[0].returnValues.from, addrSender);
    assert.strictEqual(logs[0].returnValues.data, null);
    assert.strictEqual(logs[0].returnValues.value, transferVal.toString());
  });

  it("Can not transfer more tokens than an account has balance from External Owned Account(EOA) to a contract", async () => {
    let mockReceivingContract = await MockReceivingContract.new({
      from: addrOwner
    });

    const addrSender = accounts[2];
    const addrRecipient = mockReceivingContract.address;

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

    const transferVal = fundVal + 50;
    let actualError = null;
    try {
      const transferRes = await CONTRACT.transferNoData(
        addrRecipient,
        transferVal
      ).send({ from: addrSender });
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
      "Error: Returned error: VM Exception while processing transaction: revert You must have sufficent balance to perform this operation"
    );
  });

  it("Can not transfer tokens from External Owned Account(EOA) to a contract without a recieving function", async () => {
    let notAReceivingContract = await NotAReceivingContract.new({
      from: addrOwner
    });

    const addrSender = accounts[2];
    const addrRecipient = notAReceivingContract.address;

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

    const transferVal = 50;
    let actualError = null;
    try {
      const transferRes = await CONTRACT.transferNoData(
        addrRecipient,
        transferVal
      ).send({ from: addrSender });
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
  */
});
