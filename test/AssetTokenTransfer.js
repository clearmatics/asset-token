// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+
const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const { filterEvent } = require("./helpers") 
const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = artifacts.require("AssetToken");
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
    CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1], {gas: 100000000});

    // call the constructor 
    await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1, zeroRegistryAddress);
  });

  describe("Transfer modifiers check", () => {
    it("Cannot transfer more tokens than in the account", async () => {
      const addrSender = accounts[2];
      const addrRecipient = accounts[3];

      const totalSupplyStart = await CONTRACT.totalSupply();
      const balanceSenderStart = await CONTRACT.balanceOf(addrSender);
      const balanceRecipientStart = await CONTRACT.balanceOf(
        addrRecipient
      );

      const fundVal = 100;
      const fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

      const totalSupplyFund = await CONTRACT.totalSupply();
      const balanceSenderFund = await CONTRACT.balanceOf(addrSender);
      const balanceRecipientFund = await CONTRACT.balanceOf(
        addrRecipient
      );

      let actualError = null;
      try {
        const transferVal = parseInt(balanceSenderFund) + 50;
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data, {from: addrSender}
        )
      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfterTransfer = await CONTRACT.totalSupply();
      const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
        addrSender
      );
      const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
        addrRecipient
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
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert"
      );
    });

    it("Contract Owner cannot be the recipient in a transfer", async () => {
      const addrSender = accounts[2];
      const addrRecipient = addrOwner;

      const totalSupplyStart = await CONTRACT.totalSupply();
      const balanceSenderStart = await CONTRACT.balanceOf(addrSender);
      const balanceRecipientStart = await CONTRACT.balanceOf(
        addrRecipient
      );

      const fundVal = 100;
      const fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

      const totalSupplyFund = await CONTRACT.totalSupply();
      const balanceSenderFund = await CONTRACT.balanceOf(addrSender);
      const balanceRecipientFund = await CONTRACT.balanceOf(
        addrRecipient
      );

      let actualError = null;
      try {
        const transferVal = 50;
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data, {from: addrSender}
        )
      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfterTransfer = await CONTRACT.totalSupply();
      const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
        addrSender
      );
      const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
        addrOwner
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
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("Contract Owner cannot be the sender in a transfer", async () => {
      const addrSender = addrOwner;
      const addrRecipient = accounts[2];

      const totalSupplyStart = await CONTRACT.totalSupply();
      const balanceSenderStart = await CONTRACT.balanceOf(addrSender);
      const balanceRecipientStart = await CONTRACT.balanceOf(
        addrRecipient
      );

      let actualError = null;
      try {
        const transferVal = 50;
        const transferRes = await CONTRACT.send(
          addrRecipient,
          transferVal,
          data, {from: addrSender}
        )
      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfterTransfer = await CONTRACT.totalSupply();
      const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
        addrOwner
      );

      assert.strictEqual(
        parseInt(totalSupplyStart),
        parseInt(totalSupplyAfterTransfer)
      );

      assert.strictEqual(
        parseInt(balanceRecipientStart),
        parseInt(balanceRecipientAfterTransfer)
      );

      assert.strictEqual(
        actualError.toString().split(" --")[0],
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

          await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

          balanceSenderFund = await CONTRACT.balanceOf(addrSender);
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
              await CONTRACT.send(addrRecipient, transferVal, data, {from: addrSender})
            } catch (error) {
              actualError = error;
            }

            assert.strictEqual(
              actualError.toString().split(" --")[0],
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
                data, {from: defaultOperator}
              )
            } catch (error) {
              actualError = error;
            }

            assert.strictEqual(
              actualError.toString().split(" --")[0],
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
            );
          });

          it("send function completes - balances updated", async () => {
            await CONTRACT.send(addrRecipient, transferVal, data, {from: addrSender})

            balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            );

            balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            );

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
              data, {from: defaultOperator}
            )

            balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            );

            balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            );

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

            const totalSupplyStart = await CONTRACT.totalSupply();
            const balanceSenderStart = await CONTRACT.balanceOf(
              addrSender
            );
            const balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            );

            const fundVal = 100;
            const fundRes = await CONTRACT.fund(addrSender, fundVal, {from:addrOwner})

            const totalSupplyFund = await CONTRACT.totalSupply();
            const balanceSenderFund = await CONTRACT.balanceOf(
              addrSender
            );
            const balanceRecipientFund = await CONTRACT.balanceOf(
              addrRecipient
            );

            const transferVal = 50;

            try {
              const transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data, {from: addrSender}
              )
            } catch (err) {
              actualError = err;
            }

            const totalSupplyAfterTransfer = await CONTRACT.totalSupply();
            const balanceSenderAfterTransfer = await CONTRACT.balanceOf(
              addrSender
            );
            const balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
              addrRecipient
            );

            assert.equal(
              actualError.toString().split(" --")[0],
              "Error: Returned error: VM Exception while processing transaction: revert Tokens to receive revert"
            );
            assert.deepEqual(balanceSenderAfterTransfer, balanceSenderFund);
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

              totalSupplyStart = await CONTRACT.totalSupply();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender);
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              );

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

              totalSupplyFund = await CONTRACT.totalSupply();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender);
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              );

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data, {from: addrSender}
              )

              totalSupplyAfterTransfer = await CONTRACT.totalSupply();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              );
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              );
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
              const transferEvent = filterEvent(transferRes, "Sent")
              const transferEventFrom = transferEvent.args.from;
              const transferEventTo = transferEvent.args.to;
              const transferEventValue = parseInt(
                transferEvent.args.amount
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

              totalSupplyStart = await CONTRACT.totalSupply();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender);
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              );

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

              totalSupplyFund = await CONTRACT.totalSupply();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender);
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              );

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data, {from: addrSender}
              )

              totalSupplyAfterTransfer = await CONTRACT.totalSupply();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              );
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              );
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
              const transferEvent = filterEvent(transferRes, "Sent")
              const transferEventFrom = transferEvent.args.from;
              const transferEventTo = transferEvent.args.to;
              const transferEventValue = parseInt(
                transferEvent.args.amount
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

              totalSupplyStart = await CONTRACT.totalSupply();
              balanceSenderStart = await CONTRACT.balanceOf(addrSender);
              balanceRecipientStart = await CONTRACT.balanceOf(
                addrRecipient
              );

              fundVal = 100;
              fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

              totalSupplyFund = await CONTRACT.totalSupply();
              balanceSenderFund = await CONTRACT.balanceOf(addrSender);
              balanceRecipientFund = await CONTRACT.balanceOf(
                addrRecipient
              );

              transferVal = 50;
              transferRes = await CONTRACT.send(
                addrRecipient,
                transferVal,
                data, {from: addrSender}
              )

              totalSupplyAfterTransfer = await CONTRACT.totalSupply();
              balanceSenderAfterTransfer = await CONTRACT.balanceOf(
                addrSender
              );
              balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
                addrRecipient
              );
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
              const transferEvent = filterEvent(transferRes, "Sent")
              const transferEventFrom = transferEvent.args.from;
              const transferEventTo = transferEvent.args.to;
              const transferEventValue = parseInt(
                transferEvent.args.amount
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

          balanceSenderStart = await CONTRACT.balanceOf(addrSender);
          balanceRecipientStart = await CONTRACT.balanceOf(
            addrRecipient
          );

          fundVal = 100;
          fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

          balanceSenderFund = await CONTRACT.balanceOf(addrSender);

          transferVal = 100;
        });

        it("reverts the transaction and the state", async () => {
          try {
            sendRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data, {from: addrSender}
            )
          } catch (err) {
            actualError = err;
          }

          balanceSenderAfterTransfer = await CONTRACT.balanceOf(
            addrSender
          );
          balanceRecipientAfterTransfer = await CONTRACT.balanceOf(
            addrRecipient
          );

          assert.equal(
            actualError.toString().split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert Tokens to send revert"
          );
          assert.deepEqual(balanceSenderAfterTransfer, balanceSenderFund);
          assert.equal(parseInt(balanceRecipientAfterTransfer), 0);
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

            totalSupplyStart = await CONTRACT.totalSupply();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender);
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            );

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

            totalSupplyFund = await CONTRACT.totalSupply();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender);

            transferVal = 100;

            sendRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data, {from: addrSender}
            )
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            );
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            );

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
            const transferEvent = filterEvent(sendRes, "Sent")
            assert.equal(transferEvent.args.operator, addrSender);
            assert.equal(transferEvent.args.from, addrSender);
            assert.equal(transferEvent.args.to, addrRecipient);
            assert.equal(transferEvent.args.amount, transferVal);
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

            totalSupplyStart = await CONTRACT.totalSupply();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender);
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            );

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

            totalSupplyFund = await CONTRACT.totalSupply();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender);

            transferVal = 100;

            sendRes = await contractSender.send(
              CONTRACT.address,
              addrRecipient,
              transferVal,
              data,
              { from: accounts[5] }
            );
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            );
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            );

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

            totalSupplyStart = await CONTRACT.totalSupply();
            balanceSenderStart = await CONTRACT.balanceOf(addrSender);
            balanceRecipientStart = await CONTRACT.balanceOf(
              addrRecipient
            );

            fundVal = 100;
            fundRes = await CONTRACT.fund(addrSender, fundVal, {from: addrOwner})

            totalSupplyFund = await CONTRACT.totalSupply();
            balanceSenderFund = await CONTRACT.balanceOf(addrSender);

            transferVal = 100;

            sendRes = await tokenSenderImplementer.send(
              CONTRACT.address,
              addrRecipient,
              transferVal,
              data,
              { from: accounts[5] }
            );
          });

          it("updates token balance state", async () => {
            const balanceRecipientAfter = await CONTRACT.balanceOf(
              addrRecipient
            );
            const balanceSenderAfter = await CONTRACT.balanceOf(
              addrSender
            );

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
