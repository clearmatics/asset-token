// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+
const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");
const MockImplementerContract = artifacts.require("MockRecipientContract");

let CONTRACT;
let TOKENS_RECIPIENT_INTERFACE_HASH = web3.utils.keccak256(
  "ERC777TokensRecipient"
);

contract("AssetTokenTransfer", accounts => {
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
      initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator]]
    });

    CONTRACT = PROXY.methods;
  });

  describe("Unallowed transfers", () => {
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

  describe("send and receive tokens hooks", () => {
    let addrRecipient,
      addrSender,
      tokenRecipientImplemter,
      transferVal,
      fundVal,
      actualError;

    context("Receive hooks", () => {
      context("without ERC777TokensRecipient implementer", () => {
        beforeEach(async () => {
          addrSender = accounts[3];

          tokenRecipientImplemter = await MockImplementerContract.new({
            from: addrOwner
          });
          addrRecipient = await tokenRecipientImplemter.address;
          //not registering the interface to the 1820

          transferVal = 50;
          fundVal = 100;
          actualError = null;

          await CONTRACT.fund(addrSender, fundVal).send({
            from: addrOwner
          });
        });
        context("with contract recipient", () => {
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
          addrRecipient = accounts[2];
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
      });

      context("with ERC777TokensRecipient implementer", () => {
        beforeEach(async () => {
          addrRecipient = accounts[2];
          addrSender = accounts[3];

          tokenRecipientImplemter = await MockImplementerContract.new({
            from: addrOwner
          });
        });

        context("with a contract implementer for a EOA", () => {
          it("transfer tokens", async () => {
            await tokenRecipientImplemter.recipientFor(addrRecipient);

            await this.erc1820.setInterfaceImplementer(
              addrRecipient,
              TOKENS_RECIPIENT_INTERFACE_HASH,
              tokenRecipientImplemter.address,
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
            const transferRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data
            ).send({
              from: addrSender
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
            const transferEventValue = parseInt(
              transferEvent.returnValues.amount
            );

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

            const logs = await tokenRecipientImplemter.getPastEvents(
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
            recipientContract = await MockImplementerContract.new({
              from: addrOwner
            });

            addrRecipient = recipientContract.address;

            await tokenRecipientImplemter.recipientFor(addrRecipient);

            await recipientContract.registerRecipient(
              tokenRecipientImplemter.address
            );
          });

          it("transfer tokens", async () => {
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
            const transferRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data
            ).send({
              from: addrSender
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
            const transferEventValue = parseInt(
              transferEvent.returnValues.amount
            );

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

            const logs = await tokenRecipientImplemter.getPastEvents(
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
            addrRecipient = tokenRecipientImplemter.address;

            await tokenRecipientImplemter.recipientFor(addrRecipient);
          });

          it("transfer tokens", async () => {
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
            const transferRes = await CONTRACT.send(
              addrRecipient,
              transferVal,
              data
            ).send({
              from: addrSender
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
            const transferEventValue = parseInt(
              transferEvent.returnValues.amount
            );

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

            const logs = await tokenRecipientImplemter.getPastEvents(
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

    context("Send hooks", () => {
      context("with a contract implementer for EOA", () => {});
      context("with a contract implementer for another contract", () => {});
      context("with a contract implementer for itself", () => {});
    });
  });
});
