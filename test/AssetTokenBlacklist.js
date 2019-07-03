// Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");

let CONTRACT;

contract("Asset Token", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const defaultOperator = accounts[9];
  const data = web3.utils.randomHex(0);

  describe("Controller delegation", () => {
    let delegate, res, error;
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);
      PROJECT = await TestHelper({ from: proxyOwner });

      //contains logic contract
      PROXY = await PROJECT.createProxy(AssetToken, {
        initMethod: "initialize",
        initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], true]
      });

      CONTRACT = PROXY.methods;

      delegate = accounts[2];

      res = await CONTRACT.setListsController(delegate).send({
        from: addrOwner
      });

      error = null;
    });

    it("Delegation event triggered", async () => {
      const eventDel = res.events.ListDelegation;
      assert.equal(eventDel.returnValues.member, delegate);
    });

    it("Delegate account can't delegate", async () => {
      const thirdParty = accounts[3];
      try {
        await CONTRACT.setListsController(thirdParty).send({
          from: delegate
        });
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString(),
        "Error: Returned error: VM Exception while processing transaction: revert Only the contract owner can perform this operation"
      );
    });

    it("Delegate can't take part of a payment", async () => {
      const recipient = accounts[3];
      try {
        await CONTRACT.send(recipient, 10, data).send({ from: delegate });
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString(),
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("Nor use an operator for a payment", async () => {
      const recipient = accounts[3];
      try {
        await CONTRACT.operatorSend(delegate, recipient, 10, data, data).send({
          from: defaultOperator
        });
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString(),
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("Delegate can blacklist an address", async () => {
      const victim = accounts[4];

      await CONTRACT.denyAddress(victim).send({ from: delegate });

      const isAllowedToSend = await CONTRACT.isAllowedToSend(victim).call();
      assert.equal(isAllowedToSend, false);
    });

    it("Revokes delegation", async () => {
      const tx = await CONTRACT.setListsController(addrOwner).send({
        from: addrOwner
      });
      const eventDel = await tx.events.ListDelegation;
      assert.equal(eventDel.returnValues.member, addrOwner);
    });
  });

  describe("Blacklist mode", () => {
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

    it("Accounts are allowed by default", async () => {
      for (let i = 0; i < accounts.length; i++) {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(
          accounts[i]
        ).call();
        assert.equal(isAllowedToSend, true);
      }
    });

    context("Blacklisting an account", async () => {
      let denyEvent,
        allowedEvent = null,
        victim;
      beforeEach(async () => {
        victim = accounts[3];
        const res = await CONTRACT.denyAddress(victim).send({
          from: addrOwner
        });
        denyEvent = res.events.Denied;
      });

      it("Not allowed to send anymore", async () => {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(victim).call();
        assert.equal(isAllowedToSend, false);
      });

      it("Emits Denied event", () => {
        assert.notEqual(denyEvent, null);
        assert.equal(denyEvent.returnValues.who, victim);
        assert.equal(denyEvent.returnValues.isBlacklist, true);
      });

      context("Payment operations", () => {
        let addrRecipient, fundVal, actualError;
        beforeEach(async () => {
          addrRecipient = accounts[4];
          fundVal = 100;
          actualError = null;

          await CONTRACT.fund(victim, fundVal).send({
            from: addrOwner
          });
        });

        it("Send operation is reverted", async () => {
          try {
            await CONTRACT.send(addrRecipient, fundVal, data).send({
              from: victim
            });
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString(),
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });

        it("OperatorSend on behalf of blacklisted account is reverted", async () => {
          try {
            await CONTRACT.operatorSend(
              victim,
              addrRecipient,
              fundVal,
              data,
              data
            ).send({
              from: defaultOperator
            });
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString(),
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });

        it("OperatorSend by a blacklisted operator is reverted", async () => {
          await CONTRACT.denyAddress(defaultOperator).send({
            from: addrOwner
          });

          try {
            await CONTRACT.operatorSend(
              accounts[5],
              addrRecipient,
              fundVal,
              data,
              data
            ).send({
              from: defaultOperator
            });
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString(),
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });
      });

      context("Allow that account again", async () => {
        beforeEach(async () => {
          const res = await CONTRACT.allowAddress(victim).send({
            from: addrOwner
          });

          allowedEvent = res.events.Allowed;
        });

        it("Allowed to send again", async () => {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(victim).call();
          assert.equal(isAllowedToSend, true);
        });

        it("Emits Allowed event", () => {
          assert.equal(allowedEvent.returnValues.who, victim);
          assert.equal(allowedEvent.returnValues.isBlacklist, true);
        });
      });
    });

    context("Switching to whitelist", () => {
      let switchEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.switchList().send({ from: addrOwner });
        switchEvent = res.events.SwitchList;
      });
      it("Emits switch event correctly", () => {
        assert.notEqual(switchEvent, undefined || null);
        assert.equal(switchEvent.returnValues.isBlacklist, false);
      });
      it("Accounts are not allowed anymore", async () => {
        for (let i = 0; i < accounts.length; i++) {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(
            accounts[i]
          ).call();
          assert.equal(isAllowedToSend, false);
        }
      });
    });
  });

  describe("Whitelist mode", () => {
    beforeEach(async () => {
      PROJECT = await TestHelper({ from: proxyOwner });

      //contains logic contract
      PROXY = await PROJECT.createProxy(AssetToken, {
        initMethod: "initialize",
        initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], false]
      });

      CONTRACT = PROXY.methods;
    });

    it("Accounts are not allowed by default", async () => {
      for (let i = 0; i < accounts.length; i++) {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(
          accounts[i]
        ).call();
        assert.equal(isAllowedToSend, false);
      }
    });

    context("Payment operations", () => {
      let addrRecipient, fundVal, actualError, addrSender;
      beforeEach(async () => {
        addrRecipient = accounts[4];
        addrSender = accounts[3];
        fundVal = 100;
        actualError = null;

        await CONTRACT.fund(addrSender, fundVal).send({
          from: addrOwner
        });
      });

      it("Send operation is reverted", async () => {
        try {
          await CONTRACT.send(addrRecipient, fundVal, data).send({
            from: addrSender
          });
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString(),
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });

      it("OperatorSend on behalf of unallowed account is reverted", async () => {
        try {
          await CONTRACT.operatorSend(
            addrSender,
            addrRecipient,
            fundVal,
            data,
            data
          ).send({
            from: defaultOperator
          });
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString(),
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });

      it("OperatorSend by an unallowed operator is reverted", async () => {
        await CONTRACT.denyAddress(defaultOperator).send({
          from: addrOwner
        });

        try {
          await CONTRACT.operatorSend(
            accounts[5],
            addrRecipient,
            fundVal,
            data,
            data
          ).send({
            from: defaultOperator
          });
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString(),
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });
    });

    context("Whitelisting an account", () => {
      const victim = accounts[8];
      let allowedEvent,
        denyEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.allowAddress(victim).send({
          from: addrOwner
        });

        allowedEvent = res.events.Allowed;
      });

      it("He is now allowed to send", async () => {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(victim).call();
        assert.equal(isAllowedToSend, true);
      });

      it("Emits Allowed event", async () => {
        assert.equal(allowedEvent.returnValues.who, victim);
        assert.equal(allowedEvent.returnValues.isBlacklist, false);
      });

      context("Deny that account again", async () => {
        beforeEach(async () => {
          const res = await CONTRACT.denyAddress(victim).send({
            from: addrOwner
          });

          denyEvent = res.events.Denied;
        });

        it("Not allowed to send anymore", async () => {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(victim).call();
          assert.equal(isAllowedToSend, false);
        });

        it("Emits Denied event", () => {
          assert.equal(denyEvent.returnValues.who, victim);
          assert.equal(denyEvent.returnValues.isBlacklist, false);
        });
      });
    });

    context("Switching to blacklist", () => {
      let switchEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.switchList().send({ from: addrOwner });
        switchEvent = res.events.SwitchList;
      });
      it("Emits switch event correctly", () => {
        assert.notEqual(switchEvent, undefined || null);
        assert.equal(switchEvent.returnValues.isBlacklist, true);
      });
      it("Accounts are now all allowed", async () => {
        for (let i = 0; i < accounts.length; i++) {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(
            accounts[i]
          ).call();
          assert.equal(isAllowedToSend, true);
        }
      });
    });
  });
});
