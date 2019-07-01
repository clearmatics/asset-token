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
  beforeEach(async () => {
    this.erc1820 = await singletons.ERC1820Registry(addrOwner);

    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(AssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner, []]
    });

    CONTRACT = PROXY.methods;
  });

  describe("Payment blacklist", () => {
    describe("Controller delegation", () => {
      let delegate, res, error;
      beforeEach(async () => {
        delegate = accounts[2];

        res = await CONTRACT.setBlacklistPermission(delegate).send({
          from: addrOwner
        });

        error = null;
      });
      it("Delegation event triggered", async () => {
        const eventDel = res.events.BlacklistDelegation;
        assert.equal(eventDel.returnValues.member, delegate);
      });

      it("Delegate account can't delegate", async () => {
        const thirdParty = accounts[3];
        try {
          await CONTRACT.setBlacklistPermission(thirdParty).send({
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

      it("Revokes delegation", async () => {
        const tx = await CONTRACT.setBlacklistPermission(addrOwner).send({
          from: addrOwner
        });
        const eventDel = await tx.events.BlacklistDelegation;
        assert.equal(eventDel.returnValues.member, addrOwner);
      });
    });
  });
});
