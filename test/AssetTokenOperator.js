// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const sha3 = require("js-sha3").keccak_256;
const { filterEvent } = require("./helpers") 
const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = artifacts.require("AssetToken");
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
  const zeroRegistryAddress = "0x0000000000000000000000000000000000000000"

  beforeEach(async () => {
    this.erc1820 = await singletons.ERC1820Registry(addrOwner);

    // PROJECT = await TestHelper({ from: proxyOwner });

    // //contains logic contract
    // PROXY = await PROJECT.createProxy(AssetToken, {
    //   initMethod: "initialize",
    //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1]
    // });

    // CONTRACT = PROXY.methods;

    // don't use the proxy or the coverage tool won't work
    CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1], {gas: 100000000});

    // call the constructor 
    await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1, zeroRegistryAddress);
  });

  describe("Operators", () => {
    let error;
    beforeEach(async () => {
      error = null;
    });

    context("Self management", () => {
      it("an account is his own operator", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(accounts[4], accounts[4]),
          true
        );
      });

      it("an account can't authorize itself", async () => {
        try {
          await CONTRACT.authorizeOperator(accounts[4], {from:accounts[4]})
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString().split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert The sender is already his own operator"
        );
      });

      it("an account can't revoke itself", async () => {
        try {
          await CONTRACT.revokeOperator(accounts[4], {from:accounts[4]})
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString().split(" --")[0],
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
        const res = await CONTRACT.authorizeOperator(newOperator, {from:tokenHolder})
    
        // const rec = await web3.eth.getTransactionReceipt(res.receipt.transactionHash);

        authorizedEvent = filterEvent(res, "AuthorizedOperator")
      });

      it("AuthorizedOperator event is emitted correctly", async () => {
        assert.notEqual(authorizedEvent, null);
        assert.equal(authorizedEvent.args.operator, newOperator);
      });

      it("added to operators list", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(newOperator, tokenHolder),
          true
        );
      });

      it("not added to default operators", async () => {
        const defaults = await CONTRACT.defaultOperators();
        for (let i = 0; i < defaults.length; i++)
          assert.notEqual(defaults[i], newOperator);
      });

      it("can be revoked", async () => {
        await CONTRACT.revokeOperator(newOperator, {from:tokenHolder})
        assert.equal(
          await CONTRACT.isOperatorFor(newOperator, tokenHolder),
          false
        );
      });

      it("RevokedOperator event is emitted correctly", async () => {
        const res = await CONTRACT.revokeOperator(newOperator, {from:tokenHolder})
       
        revokeEvent = filterEvent(res, "RevokedOperator")

        assert.notEqual(revokeEvent, null);
        assert.equal(revokeEvent.args.operator, newOperator);
      });
    });

    context("Default operators", () => {
      it("are set in constructor", async () => {
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder),
          true
        );
      });

      it("can be revoked", async () => {
        await CONTRACT.revokeOperator(defaultOperator, {from:tokenHolder})
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder),
          false
        );
      });

      it("can be re-authorized", async () => {
        await CONTRACT.revokeOperator(defaultOperator, {from:tokenHolder})
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder),
          false
        );

        await CONTRACT.authorizeOperator(defaultOperator,  {from:tokenHolder})
        assert.equal(
          await CONTRACT.isOperatorFor(defaultOperator, tokenHolder),
          true
        );
      });
    });

    context("Make operations", () => {
      let addrSender, addrRecipient, tokenRecipientImplementer;
      beforeEach(async () => {
        addrRecipient = accounts[2];
        addrSender = accounts[3];

        const res = await CONTRACT.authorizeOperator(newOperator, {from:addrSender})

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

        const totalSupplyStart = await CONTRACT.totalSupply();
        const balanceSenderStart = await CONTRACT.balanceOf(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf(
          addrRecipient
        );

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, {from:addrOwner})

        const totalSupplyFund = await CONTRACT.totalSupply();
        const balanceSenderFund = await CONTRACT.balanceOf(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf(
          addrRecipient
        );

        const transferVal = 50;
        const transferRes = await CONTRACT.operatorSend(
          addrSender,
          addrRecipient,
          transferVal,
          userData,
          operatorData, {from:newOperator}
        )

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
          addrSender
        );
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
          addrRecipient
        );

        const transferEvent = filterEvent(transferRes, "Sent");

        const transferEventFrom = transferEvent.args.from;
        const transferEventTo = transferEvent.args.to;
        const transferEventValue = parseInt(transferEvent.args.amount);

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
        const fundRes = await CONTRACT.fund(addrSender, fundVal, {from:addrOwner})

        const totalSupplyFund = await CONTRACT.totalSupply();
        const balanceSenderFund = await CONTRACT.balanceOf(addrSender);

        const burnAmount = 50;
        const res = await CONTRACT.operatorBurn(
          addrSender,
          burnAmount,
          userData,
          operatorData, 
          { from:newOperator } 
        )

        const resEvent = filterEvent(res, "Burned")
        const totalSupplyBurn = await CONTRACT.totalSupply();
        const balanceSenderBurn = await CONTRACT.balanceOf(addrSender);

        assert.equal(totalSupplyFund - burnAmount, totalSupplyBurn);

        assert.equal(balanceSenderFund - burnAmount, balanceSenderBurn);

        assert.notEqual(resEvent, null);
        assert.equal(resEvent.args.operator, newOperator);
        assert.equal(resEvent.args.from, addrSender);
        assert.equal(resEvent.args.amount, burnAmount);
        assert.equal(resEvent.args.data, userData);
        assert.equal(resEvent.args.operatorData, operatorData);
      });

      context("if owner becomes operator", () => {
        let actualError = null;
        beforeEach(async () => {
          await CONTRACT.authorizeOperator(addrOwner, { from:addrSender })
        });
        it("operatorSend reverts", async () => {
          try {
            await CONTRACT.operatorSend(
              addrSender,
              addrRecipient,
              10,
              userData,
              userData, 
              { from:addrOwner }
            )
          } catch (err) {
            actualError = err;
          }
          assert.equal(
            actualError.toString().split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
          );
        });

        it("operatorBurn reverts", async () => {
          try {
            await CONTRACT.operatorBurn(
              addrSender,
              10,
              userData,
              userData, { from:addrOwner }
            )
          } catch (err) {
            actualError = err;
          }
          assert.equal(
            actualError.toString().split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
          );
        });
      });
    });
  });
});
