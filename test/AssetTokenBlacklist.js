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
  const data = web3.utils.randomHex(0);

  describe("Controller delegation", () => {
    let delegate, res, error;
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);
      PROJECT = await TestHelper({ from: proxyOwner });

      //contains logic contract
      PROXY = await PROJECT.createProxy(AssetToken, {
        initMethod: "initialize",
        initArgs: ["CLR", "Asset Token", addrOwner, [], true]
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
        initArgs: ["CLR", "Asset Token", addrOwner, [], true]
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
      let denyEvent = null,
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
    });
  });

  describe("Whitelist mode", () => {
    beforeEach(async () => {
      PROJECT = await TestHelper({ from: proxyOwner });

      //contains logic contract
      PROXY = await PROJECT.createProxy(AssetToken, {
        initMethod: "initialize",
        initArgs: ["CLR", "Asset Token", addrOwner, [], false]
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

    /*
    context("Whitelist an account", () => {
      const victim = accounts[8];
      beforeEach(async () => {
        const res = await CONTRACT.blacklistAddress(victim).send({
          from: addrOwner
        });
      });
      it("Only that account is blacklisted", async () => {
        const blacklisted = await CONTRACT.isBlacklisted(victim).call();
        const notBlacklisted = await CONTRACT.isBlacklisted(accounts[7]).call();

        assert.equal(blacklisted, true);
        assert.equal(notBlacklisted, false);
      });

      it("Whitelist that account again", async () => {
        await CONTRACT.whitelistAddress(victim).send({ from: addrOwner });
        const notBlacklisted = await CONTRACT.isBlacklisted(victim).call();

        assert.equal(notBlacklisted, false);
      });
    }); */
  });
});
