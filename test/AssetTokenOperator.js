// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");
const IERC777Compatible = artifacts.require("IERC777Compatible");

let CONTRACT;
let TOKENS_RECIPIENT_INTERFACE_HASH = web3.utils.keccak256(
  "ERC777TokensRecipient"
);

contract("Asset Token", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const tokenHolder = accounts[2];
  const newOperator = accounts[8];
  const defaultOperator = accounts[9];
  const userData = web3.utils.randomHex(10);
  const operatorData = web3.utils.randomHex(10);
  beforeEach(async () => {
    this.erc1820 = await singletons.ERC1820Registry(addrOwner);

    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(AssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator]]
    });

    CONTRACT = PROXY.methods;
  });

  describe("Operators", () => {
    let error;
    beforeEach(async () => {
      error = null;
    });

    context("Self management", () => {
      it("an account is his own operator", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(accounts[4], accounts[4]).call(),
          true
        );
      });

      it("an account can't authorize itself", async () => {
        try {
          await CONTRACT.authorizeOperator(accounts[4]).send({
            from: accounts[4]
          });
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString(),
          "Error: Returned error: VM Exception while processing transaction: revert The sender is already his own operator"
        );
      });

      it("an account can't revoke itself", async () => {
        try {
          await CONTRACT.revokeOperator(accounts[4]).send({
            from: accounts[4]
          });
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString(),
          "Error: Returned error: VM Exception while processing transaction: revert You cannot revoke yourself your own rights"
        );
      });
    });

    context("New operators", () => {
      let authorizedEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.authorizeOperator(newOperator).send({
          from: tokenHolder
        });

        authorizedEvent = res.events.AuthorizedOperator;
      });

      it("AuthorizedOperator event is emitted correctly", async () => {
        assert.notEqual(authorizedEvent, null);
        assert.equal(authorizedEvent.returnValues.operator, newOperator);
        assert.equal(authorizedEvent.returnValues.holder, tokenHolder);
      });

      it("added to operators list", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(newOperator, tokenHolder).call(),
          true
        );
      });

      it("not added to default operators", async () => {
        const defaults = await CONTRACT.defaultOperators().call();
        for (let i = 0; i < defaults.length; i++)
          assert.notEqual(defaults[i], newOperator);
      });

      it("can be revoked", async () => {
        await CONTRACT.revokeOperator(newOperator).send({ from: tokenHolder });
        assert.equal(
          await CONTRACT.isOperatorFor(newOperator, tokenHolder).call(),
          false
        );
      });

      it("RevokedOperator event is emitted correctly", async () => {
        const res = await CONTRACT.revokeOperator(newOperator).send({
          from: tokenHolder
        });
        const revokeEvent = res.events.RevokedOperator;

        assert.notEqual(revokeEvent, null);
        assert.equal(revokeEvent.returnValues.operator, newOperator);
        assert.equal(revokeEvent.returnValues.holder, tokenHolder);
      });
    });

    context("Default operators", () => {
      it("are set in constructor", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder).call(),
          true
        );
      });

      it("can be revoked", async () => {
        await CONTRACT.revokeOperator(defaultOperator).send({
          from: tokenHolder
        });
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder).call(),
          false
        );
      });

      it("can be re-authorized", async () => {
        await CONTRACT.revokeOperator(defaultOperator).send({
          from: tokenHolder
        });
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder).call(),
          false
        );

        await CONTRACT.authorizeOperator(defaultOperator).send({
          from: tokenHolder
        });
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder).call(),
          true
        );
      });
    });

    context("Make operations", () => {
      let addrSender, addrRecipient, tokenRecipientImplementer;
      beforeEach(async () => {
        addrRecipient = accounts[2];
        addrSender = accounts[3];

        const res = await CONTRACT.authorizeOperator(newOperator).send({
          from: addrSender
        });

        tokenRecipientImplementer = await IERC777Compatible.new({
          from: addrOwner
        });
      });

      it("transfer tokens on behalf of account", async () => {
        await tokenRecipientImplementer.recipientFor(addrRecipient);

        await this.erc1820.setInterfaceImplementer(
          addrRecipient,
          TOKENS_RECIPIENT_INTERFACE_HASH,
          tokenRecipientImplementer.address,
          { from: addrRecipient }
        );

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
        const balanceRecipientFund = await CONTRACT.balanceOf(
          addrRecipient
        ).call();

        const transferVal = 50;
        const transferRes = await CONTRACT.operatorSend(
          addrSender,
          addrRecipient,
          transferVal,
          userData,
          operatorData
        ).send({
          from: newOperator
        });

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
          addrSender
        ).call();
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
          addrRecipient
        ).call();

        const transferEvent = transferRes.events.Sent;
        const transferEventFrom = transferEvent.returnValues.from;
        const transferEventTo = transferEvent.returnValues.to;
        const transferEventValue = parseInt(transferEvent.returnValues.amount);

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

        const logs = await tokenRecipientImplementer.getPastEvents(
          "TokensReceivedCalled",
          {
            fromBlock: 0,
            toBlock: "latest"
          }
        );

        assert.strictEqual(logs[0].event, "TokensReceivedCalled");
        assert.strictEqual(logs[0].returnValues.from, addrSender);
        assert.strictEqual(logs[0].returnValues.operator, newOperator);
        assert.strictEqual(logs[0].returnValues.to, addrRecipient);
        assert.strictEqual(logs[0].returnValues.data, userData);
        assert.strictEqual(logs[0].returnValues.operatorData, operatorData);
        assert.strictEqual(logs[0].returnValues.amount, transferVal.toString());
      });

      it("burns tokens on behalf of account", async () => {
        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
          from: addrOwner
        });

        const totalSupplyFund = await CONTRACT.totalSupply().call();
        const balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

        const burnAmount = 50;
        const res = await CONTRACT.operatorBurn(
          addrSender,
          burnAmount,
          userData,
          operatorData
        ).send({ from: newOperator });

        const resEvent = res.events.Burned;
        const totalSupplyBurn = await CONTRACT.totalSupply().call();
        const balanceSenderBurn = await CONTRACT.balanceOf(addrSender).call();

        assert.equal(totalSupplyFund - burnAmount, totalSupplyBurn);

        assert.equal(balanceSenderFund - burnAmount, balanceSenderBurn);

        assert.notEqual(resEvent, null);
        assert.equal(resEvent.returnValues.operator, newOperator);
        assert.equal(resEvent.returnValues.from, addrSender);
        assert.equal(resEvent.returnValues.amount, burnAmount);
        assert.equal(resEvent.returnValues.data, userData);
        assert.equal(resEvent.returnValues.operatorData, operatorData);
      });
    });
  });

  /*
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

  */
});
