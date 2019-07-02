// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+
const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");
const IERC777Compatible = artifacts.require("IERC777Compatible");
const MockAssetToken = artifacts.require("AssetToken");

let CONTRACT;
let TOKENS_RECIPIENT_INTERFACE_HASH = web3.utils.keccak256(
  "ERC777TokensRecipient"
);
let TOKENS_SENDER_INTERFACE_HASH = web3.utils.keccak256("ERC777TokensSender");

contract("Asset Token", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const data = web3.utils.randomHex(0);
  const defaultOperator = accounts[9];

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

  describe("Transfer modifiers check", () => {
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
      const balanceRecipientFund = await CONTRACT.balanceOf(
        addrRecipient
      ).call();

      let actualError = null;
      try {
        const transferVal = parseInt(balanceSenderFund) + 50;
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data
        ).send({
          from: addrSender
        });
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
      const balanceRecipientFund = await CONTRACT.balanceOf(
        addrRecipient
      ).call();

      let actualError = null;
      try {
        const transferVal = 50;
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data
        ).send({
          from: addrSender
        });
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
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data
        ).send({
          from: addrSender
        });
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
  });

  describe("Transfer with hooks", () => {
    let addrRecipient,
      addrSender,
      tokenRecipientImplementer,
      transferVal,
      fundVal,
      actualError,
      tokenSenderImplementer,
      balanceSenderStart,
      balanceRecipientStart,
      balanceSenderFund,
      balanceRecipientFund,
      balanceSenderAfterTransfer,
      balanceRecipientAfterTransfer;

    context("Receive hooks", () => {
      context("without ERC777TokensRecipient implementer", () => {
        beforeEach(async () => {
          addrSender = accounts[3];

          transferVal = 50;
          fundVal = 100;
          actualError = null;

          await CONTRACT.fund(addrSender, fundVal).send({
            from: addrOwner
          });

          balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
        });
        context("with contract recipient", () => {
          beforeEach(async () => {
            tokenRecipientImplementer = await IERC777Compatible.new({
              from: addrOwner
            });
            addrRecipient = await tokenRecipientImplementer.address;
            //not registering the interface to the 1820
          });
          it("send function reverts", async () => {
            try {
              await CONTRACT.send(addrRecipient, transferVal, data).send({
                from: addrSender
              });
            } catch (error) {
              actualError = error;
            }

            assert.strictEqual(
              actualError.toString(),
              "Error: Returned error: VM Exception while processing transaction: revert The recipient contract must implement the ERC777TokensRecipient interface"
            );
          });

          it("operatorSend reverts", async () => {
            try {
              await CONTRACT.operatorSend(
                addrSender,
                addrRecipient,
                transferVal,
                data,
                data
              ).send({ from: defaultOperator });
            } catch (error) {
              actualError = error;
            }

            assert.strictEqual(
              actualError.toString(),
              "Error: Returned error: VM Exception while processing transaction: revert The recipient contract must implement the ERC777TokensRecipient interface"
            );
          });
        });

        context("with EOA recipient", () => {
          beforeEach(async () => {
            addrRecipient = accounts[5];
            actualError = null;

            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            ).call();
          });

          it("send function completes - balances updated", async () => {
            await CONTRACT.send(addrRecipient, transferVal, data).send({
              from: addrSender
            });

            balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            ).call();

            balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            assert.equal(
              parseInt(balanceSenderAfterTransfer),
              parseInt(balanceSenderFund) - parseInt(transferVal)
            );
            assert.equal(
              parseInt(balanceRecipientAfterTransfer),
              parseInt(balanceRecipientStart) + parseInt(transferVal)
            );
            assert.equal(actualError, null);
          });

          it("operatorSend completes - balances updated", async () => {
            await CONTRACT.operatorSend(
              addrSender,
              addrRecipient,
              transferVal,
              data,
              data
            ).send({ from: defaultOperator });

            balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            ).call();

            balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            assert.equal(
              parseInt(balanceSenderAfterTransfer),
              parseInt(balanceSenderFund) - parseInt(transferVal)
            );
            assert.equal(
              parseInt(balanceRecipientAfterTransfer),
              parseInt(balanceRecipientStart) + parseInt(transferVal)
            );
            assert.equal(actualError, null);
          });
        });
      });

      context("with ERC777TokensRecipient implementer", () => {
        let totalSupplyStart,
          balanceSenderStart,
          balanceRecipientStart,
          fundVal,
          fundRes,
          totalSupplyFund,
          balanceSenderFund,
          transferVal,
          sendRes;
        context("when the implementer reverts", () => {
          beforeEach(async () => {
            addrRecipient = accounts[2];
            addrSender = accounts[3];

            tokenRecipientImplementer = await IERC777Compatible.new({
              from: addrOwner
            });

            tokenRecipientImplementer.setShouldRevertReceive(true, {
              from: addrRecipient
            });
          });

          it("reverts the transfer and the state", async () => {
            await tokenRecipientImplementer.recipientFor(addrRecipient);

            await this.erc1820.setInterfaceImplementer(
              addrRecipient,
              TOKENS_RECIPIENT_INTERFACE_HASH,
              tokenRecipientImplementer.address,
              { from: addrRecipient }
            );

            const totalSupplyStart = await CONTRACT.totalSupply().call();
            const balanceSenderStart = await CONTRACT.balanceOf(
              addrSender
            ).call();
            const balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            const fundVal = 100;
            const fundRes = await CONTRACT.fund(addrSender, fundVal).send({
              from: addrOwner
            });

            const totalSupplyFund = await CONTRACT.totalSupply().call();
            const balanceSenderFund = await CONTRACT.balanceOf(
              addrSender
            ).call();
            const balanceRecipientFund = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            const transferVal = 50;

            try {
              const transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data
              ).send({
                from: addrSender
              });
            } catch (err) {
              actualError = err;
            }

            const totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
            const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            ).call();
            const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            assert.equal(
              actualError.toString(),
              "Error: Returned error: VM Exception while processing transaction: revert Tokens to receive revert"
            );
            assert.equal(balanceSenderAfterTransfer, balanceSenderFund);
            assert.equal(balanceRecipientAfterTransfer, 0);
          });
        });
        context("when the implementer doesn't revert", () => {
          beforeEach(async () => {
            addrRecipient = accounts[2];
            addrSender = accounts[3];

            tokenRecipientImplementer = await IERC777Compatible.new({
              from: addrOwner
            });
          });

          context("with a contract implementer for a EOA", () => {
            beforeEach(async () => {
              await tokenRecipientImplementer.recipientFor(addrRecipient);

              await this.erc1820.setInterfaceImplementer(
                addrRecipient,
                TOKENS_RECIPIENT_INTERFACE_HASH,
                tokenRecipientImplementer.address,
                { from: addrRecipient }
              );

              totalSupplyStart = await CONTRACT.totalSupply().call();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal).send({
                from: addrOwner
              });

              totalSupplyFund = await CONTRACT.totalSupply().call();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data
              ).send({
                from: addrSender
              });

              totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              ).call();
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              ).call();
            });

            it("updates token balance state", async () => {
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

            it("emits contract Sent event", () => {
              const transferEvent = transferRes.events.Sent;
              const transferEventFrom = transferEvent.returnValues.from;
              const transferEventTo = transferEvent.returnValues.to;
              const transferEventValue = parseInt(
                transferEvent.returnValues.amount
              );

              assert(transferEvent != null);
              assert.strictEqual(transferEventFrom, addrSender);
              assert.strictEqual(transferEventTo, addrRecipient);
              assert.strictEqual(transferEventValue, transferVal);
            });

            it("triggers tokensReceived hook", async () => {
              const logs = await tokenRecipientImplementer.getPastEvents(
                "TokensReceivedCalled",
                {
                  fromBlock: 0,
                  toBlock: "latest"
                }
              );

              assert.strictEqual(logs[0].event, "TokensReceivedCalled");
              assert.strictEqual(logs[0].returnValues.from, addrSender);
              assert.strictEqual(logs[0].returnValues.operator, addrSender);
              assert.strictEqual(logs[0].returnValues.to, addrRecipient);
              assert.strictEqual(logs[0].returnValues.data, null);
              assert.strictEqual(
                logs[0].returnValues.amount,
                transferVal.toString()
              );
            });
          });

          context("with a contract implementer for another contract", () => {
            let recipientContract;
            beforeEach(async () => {
              recipientContract = await IERC777Compatible.new({
                from: addrOwner
              });

              addrRecipient = recipientContract.address;

              await tokenRecipientImplementer.recipientFor(addrRecipient);

              await recipientContract.registerRecipient(
                tokenRecipientImplementer.address
              );

              totalSupplyStart = await CONTRACT.totalSupply().call();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal).send({
                from: addrOwner
              });

              totalSupplyFund = await CONTRACT.totalSupply().call();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data
              ).send({
                from: addrSender
              });

              totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              ).call();
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              ).call();
            });

            it("updates token balance state", async () => {
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

            it("emits contract Sent event", () => {
              const transferEvent = transferRes.events.Sent;
              const transferEventFrom = transferEvent.returnValues.from;
              const transferEventTo = transferEvent.returnValues.to;
              const transferEventValue = parseInt(
                transferEvent.returnValues.amount
              );

              assert(transferEvent != null);
              assert.strictEqual(transferEventFrom, addrSender);
              assert.strictEqual(transferEventTo, addrRecipient);
              assert.strictEqual(transferEventValue, transferVal);
            });

            it("triggers tokensReceived hook", async () => {
              const logs = await tokenRecipientImplementer.getPastEvents(
                "TokensReceivedCalled",
                {
                  fromBlock: 0,
                  toBlock: "latest"
                }
              );

              assert.strictEqual(logs[0].event, "TokensReceivedCalled");
              assert.strictEqual(logs[0].returnValues.from, addrSender);
              assert.strictEqual(logs[0].returnValues.operator, addrSender);
              assert.strictEqual(logs[0].returnValues.to, addrRecipient);
              assert.strictEqual(logs[0].returnValues.data, null);
              assert.strictEqual(
                logs[0].returnValues.amount,
                transferVal.toString()
              );
            });
          });

          context("with a contract implementer for itself", () => {
            beforeEach(async () => {
              addrRecipient = tokenRecipientImplementer.address;

              await tokenRecipientImplementer.recipientFor(addrRecipient);

              totalSupplyStart = await CONTRACT.totalSupply().call();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal).send({
                from: addrOwner
              });

              totalSupplyFund = await CONTRACT.totalSupply().call();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              ).call();

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data
              ).send({
                from: addrSender
              });

              totalSupplyAfterTransfer = await CONTRACT.totalSupply().call();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              ).call();
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              ).call();
            });

            it("updates token balance state", async () => {
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

            it("emits contract Sent event", () => {
              const transferEvent = transferRes.events.Sent;
              const transferEventFrom = transferEvent.returnValues.from;
              const transferEventTo = transferEvent.returnValues.to;
              const transferEventValue = parseInt(
                transferEvent.returnValues.amount
              );

              assert(transferEvent != null);
              assert.strictEqual(transferEventFrom, addrSender);
              assert.strictEqual(transferEventTo, addrRecipient);
              assert.strictEqual(transferEventValue, transferVal);
            });

            it("triggers tokensReceived hook", async () => {
              const logs = await tokenRecipientImplementer.getPastEvents(
                "TokensReceivedCalled",
                {
                  fromBlock: 0,
                  toBlock: "latest"
                }
              );

              assert.strictEqual(logs[0].event, "TokensReceivedCalled");
              assert.strictEqual(logs[0].returnValues.from, addrSender);
              assert.strictEqual(logs[0].returnValues.operator, addrSender);
              assert.strictEqual(logs[0].returnValues.to, addrRecipient);
              assert.strictEqual(logs[0].returnValues.data, null);
              assert.strictEqual(
                logs[0].returnValues.amount,
                transferVal.toString()
              );
            });
          });
        });
      });
    });

    context("Send hooks", () => {
      let totalSupplyStart,
        balanceSenderStart,
        balanceRecipientStart,
        fundVal,
        fundRes,
        totalSupplyFund,
        balanceSenderFund,
        transferVal,
        sendRes;
      beforeEach(async () => {
        addrRecipient = accounts[3];
      });

      context("when the implementer reverts", () => {
        beforeEach(async () => {
          tokenSenderImplementer = await IERC777Compatible.new();

          addrSender = accounts[4];
          tokenSenderImplementer.setShouldRevertSend(true, {
            from: addrSender
          });

          //register sender implementer for EOA
          await tokenSenderImplementer.senderFor(addrSender);
          await this.erc1820.setInterfaceImplementer(
            addrSender,
            TOKENS_SENDER_INTERFACE_HASH,
            tokenSenderImplementer.address,
            { from: addrSender }
          );

          balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
          balanceRecipientStart = await CONTRACT.balanceOf(
            addrRecipient
          ).call();

          fundVal = 100;
          fundRes = await CONTRACT.fund(addrSender, fundVal).send({
            from: addrOwner
          });

          balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

          transferVal = 100;
        });

        it("reverts the transaction and the state", async () => {
          try {
            sendRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data
            ).send({
              from: addrSender
            });
          } catch (err) {
            actualError = err;
          }

          balanceSenderAfterTransfer = await CONTRACT.balanceOf(
            addrSender
          ).call();
          balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
            addrRecipient
          ).call();

          assert.equal(
            actualError.toString(),
            "Error: Returned error: VM Exception while processing transaction: revert Tokens to send revert"
          );
          assert.equal(balanceSenderAfterTransfer, balanceSenderFund);
          assert.equal(balanceRecipientAfterTransfer, 0);
        });
      });

      context("when the implementer doesn't revert", () => {
        let sentSignature = web3.utils.keccak256(
          "Sent(address,address,address,uint256,bytes,bytes)"
        );
        context("with a contract implementer for EOA", () => {
          beforeEach(async () => {
            tokenSenderImplementer = await IERC777Compatible.new();

            addrSender = accounts[4];

            //register sender implementer for EOA
            await tokenSenderImplementer.senderFor(addrSender);
            await this.erc1820.setInterfaceImplementer(
              addrSender,
              TOKENS_SENDER_INTERFACE_HASH,
              tokenSenderImplementer.address,
              { from: addrSender }
            );

            totalSupplyStart = await CONTRACT.totalSupply().call();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal).send({
              from: addrOwner
            });

            totalSupplyFund = await CONTRACT.totalSupply().call();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

            transferVal = 100;

            sendRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data
            ).send({
              from: addrSender
            });
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            ).call();
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            ).call();

            assert.equal(
              parseInt(balanceRecipientAfter),
              parseInt(balanceRecipientStart) + parseInt(transferVal)
            );

            assert.equal(
              parseInt(balanceSenderAfter),
              parseInt(balanceSenderFund) - transferVal
            );
          });

          it("triggers tokensToSend hook function", async () => {
            const logs = await tokenSenderImplementer.getPastEvents(
              "TokensToSendCalled",
              {
                fromBlock: 0,
                toBlock: "latest"
              }
            );

            assert.equal(logs[0].event, "TokensToSendCalled");
            assert.equal(logs[0].returnValues.operator, addrSender);
            assert.equal(logs[0].returnValues.from, addrSender);
            assert.equal(logs[0].returnValues.to, addrRecipient);
            assert.equal(logs[0].returnValues.amount, transferVal);
          });

          it("token contract emits Sent event", async () => {
            const transferEvent = sendRes.events.Sent;
            assert.notEqual(transferEvent, null);
            assert.equal(transferEvent.returnValues.operator, addrSender);
            assert.equal(transferEvent.returnValues.from, addrSender);
            assert.equal(transferEvent.returnValues.to, addrRecipient);
            assert.equal(transferEvent.returnValues.amount, transferVal);
          });
        });
        context("with a contract implementer for another contract", () => {
          beforeEach(async () => {
            tokenSenderImplementer = await IERC777Compatible.new();
            const contractSender = await IERC777Compatible.new();

            addrSender = contractSender.address;

            //register sender implementer for contracts
            await tokenSenderImplementer.senderFor(addrSender);
            await contractSender.registerSender(tokenSenderImplementer.address);

            //sender contract must be also receiver implementer for fund operations - itself
            await contractSender.registerRecipient(addrSender);

            totalSupplyStart = await CONTRACT.totalSupply().call();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal).send({
              from: addrOwner
            });

            totalSupplyFund = await CONTRACT.totalSupply().call();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

            transferVal = 100;

            sendRes = await contractSender.send(
              PROXY._address,
              addrRecipient,
              transferVal,
              data,
              { from: accounts[5] }
            );
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            ).call();
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            ).call();

            assert.equal(
              parseInt(balanceRecipientAfter),
              parseInt(balanceRecipientStart) + parseInt(transferVal)
            );

            assert.equal(
              parseInt(balanceSenderAfter),
              parseInt(balanceSenderFund) - transferVal
            );
          });

          it("triggers tokensToSend hook function", async () => {
            const logs = await tokenSenderImplementer.getPastEvents(
              "TokensToSendCalled",
              {
                fromBlock: 0,
                toBlock: "latest"
              }
            );

            assert.equal(logs[0].event, "TokensToSendCalled");
            assert.equal(logs[0].returnValues.operator, addrSender);
            assert.equal(logs[0].returnValues.from, addrSender);
            assert.equal(logs[0].returnValues.to, addrRecipient);
            assert.equal(logs[0].returnValues.amount, transferVal);
          });

          it("token contract emits Sent event", async () => {
            const rec = await web3.eth.getTransactionReceipt(
              sendRes.receipt.transactionHash
            );
            const transferEvent = rec.logs[1].topics;
            assert.equal(transferEvent[0], sentSignature);
          });
        });
        context("with a contract implementer for itself", () => {
          beforeEach(async () => {
            tokenSenderImplementer = await IERC777Compatible.new();

            addrSender = tokenSenderImplementer.address;

            //register sender implementer for EOA
            await tokenSenderImplementer.senderFor(addrSender);

            //register recipient to get funds
            await tokenSenderImplementer.recipientFor(addrSender);

            totalSupplyStart = await CONTRACT.totalSupply().call();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender).call();
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            ).call();

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal).send({
              from: addrOwner
            });

            totalSupplyFund = await CONTRACT.totalSupply().call();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender).call();

            transferVal = 100;

            sendRes = await tokenSenderImplementer.send(
              PROXY._address,
              addrRecipient,
              transferVal,
              data,
              { from: accounts[5] }
            );
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            ).call();
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            ).call();

            assert.equal(
              parseInt(balanceRecipientAfter),
              parseInt(balanceRecipientStart) + parseInt(transferVal)
            );

            assert.equal(
              parseInt(balanceSenderAfter),
              parseInt(balanceSenderFund) - transferVal
            );
          });

          it("triggers tokensToSend hook function", async () => {
            const logs = await tokenSenderImplementer.getPastEvents(
              "TokensToSendCalled",
              {
                fromBlock: 0,
                toBlock: "latest"
              }
            );

            assert.equal(logs[0].event, "TokensToSendCalled");
            assert.equal(logs[0].returnValues.operator, addrSender);
            assert.equal(logs[0].returnValues.from, addrSender);
            assert.equal(logs[0].returnValues.to, addrRecipient);
            assert.equal(logs[0].returnValues.amount, transferVal);
          });

          it("token contract emits Sent event", async () => {
            const rec = await web3.eth.getTransactionReceipt(
              sendRes.receipt.transactionHash
            );
            const transferEvent = rec.logs[1].topics;
            assert.equal(transferEvent[0], sentSignature);
          });
        });
      });
    });
  });
});
