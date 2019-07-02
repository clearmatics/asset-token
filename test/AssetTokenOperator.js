// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const sha3 = require("js-sha3").keccak_256;

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
      initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], true]
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
      let authorizedOperatorSignature =
        "0x" + sha3("AuthorizedOperator(address,address)");
      let revokedOperatorSignature =
        "0x" + sha3("RevokedOperator(address,address)");

      beforeEach(async () => {
        const res = await CONTRACT.authorizeOperator(newOperator).send({
          from: tokenHolder
        });

        const rec = await web3.eth.getTransactionReceipt(res.transactionHash);

        authorizedEvent = rec.logs[0].topics;
      });

      it("AuthorizedOperator event is emitted correctly", async () => {
        assert.notEqual(authorizedEvent, null);
        assert.equal(authorizedEvent[0], authorizedOperatorSignature);
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
        const rec = await web3.eth.getTransactionReceipt(res.transactionHash);

        revokeEvent = rec.logs[0].topics;

        assert.notEqual(revokeEvent, null);
        assert.equal(revokeEvent[0], revokedOperatorSignature);
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
});
