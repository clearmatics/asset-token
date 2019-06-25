// Copyright (c) 2017 Clearmatics Technologies Ltd

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

  describe("Burn", () => {
    let addrRecipient,
      totalSupplyBefore,
      balanceRecipientBefore,
      fundVal,
      fundRes,
      totalSupplyFunded,
      balanceRecipientFunded,
      actualError,
      fundEvent,
      fundEventVal,
      fundEventBalance;
    beforeEach(async () => {
      addrRecipient = accounts[2];

      totalSupplyBefore = await CONTRACT.totalSupply().call();
      balanceRecipientBefore = await CONTRACT.balanceOf(addrRecipient).call();

      fundVal = 100;
      fundRes = await CONTRACT.fund(addrRecipient, fundVal).send({
        from: addrOwner
      });

      totalSupplyFunded = await CONTRACT.totalSupply().call();
      balanceRecipientFunded = await CONTRACT.balanceOf(addrRecipient).call();
      actualError = null;

      fundEvent = fundRes.events.Fund;
      fundEventVal = parseInt(fundEvent.returnValues.value);
      fundEventBalance = parseInt(fundEvent.returnValues.balance);
    });

    it("more tokens than in the account - reverts", async () => {
      try {
        const defundVal = parseInt(balanceRecipientFunded) + 50;
        const defundRes = await CONTRACT.burn(defundVal, data).send({
          from: addrRecipient
        });
      } catch (error) {
        actualError = error;
      }

      const totalSupplyDefunded = await CONTRACT.totalSupply().call();
      const balanceRecipientDefunded = await CONTRACT.balanceOf(
        addrRecipient
      ).call();

      assert.strictEqual(
        parseInt(totalSupplyBefore) + fundVal,
        parseInt(totalSupplyFunded)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore) + fundVal,
        parseInt(balanceRecipientFunded)
      );

      assert.strictEqual(
        parseInt(totalSupplyFunded),
        parseInt(totalSupplyDefunded)
      );
      assert.strictEqual(
        parseInt(balanceRecipientFunded),
        parseInt(balanceRecipientDefunded)
      );
      assert.strictEqual(
        actualError.toString(),
        "Error: Returned error: VM Exception while processing transaction: revert"
      );
    });

    it("correctly burn tokens", async () => {
      const defundVal = 50;
      const defundRes = await CONTRACT.burn(defundVal, data).send({
        from: addrRecipient
      });

      const defundEvent = defundRes.events.Burned;
      const defundEventVal = parseInt(defundEvent.returnValues.amount);

      const totalSupplyDefunded = await CONTRACT.totalSupply().call();
      const balanceRecipientDefunded = await CONTRACT.balanceOf(
        addrRecipient
      ).call();

      assert(fundEvent != null);
      assert.strictEqual(fundVal, fundEventVal);
      assert.strictEqual(
        parseInt(balanceRecipientBefore) + fundVal,
        parseInt(fundEventBalance)
      );
      assert.strictEqual(
        parseInt(totalSupplyBefore) + fundVal,
        parseInt(totalSupplyFunded)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore) + fundVal,
        parseInt(balanceRecipientFunded)
      );

      assert(defundEvent != null);
      assert.strictEqual(defundVal, defundEventVal);

      assert.strictEqual(
        parseInt(totalSupplyFunded) - defundVal,
        parseInt(totalSupplyDefunded)
      );
      assert.strictEqual(
        parseInt(balanceRecipientFunded) - defundVal,
        parseInt(balanceRecipientDefunded)
      );
    });

    it("the contract owner - reverts", async () => {
      const balanceOwnerBefore = await CONTRACT.balanceOf(addrOwner).call();
      try {
        const defundVal = 50;
        const defundRes = await CONTRACT.burn(defundVal, data).send({
          from: addrOwner
        });
      } catch (error) {
        actualError = error;
      }

      const totalSupplyDefunded = await CONTRACT.totalSupply().call();
      const balanceOwnerDefunded = await CONTRACT.balanceOf(addrOwner).call();

      assert.strictEqual(
        parseInt(totalSupplyFunded),
        parseInt(totalSupplyDefunded)
      );
      assert.strictEqual(
        parseInt(balanceOwnerBefore),
        parseInt(balanceOwnerDefunded)
      );
      assert.strictEqual(
        actualError.toString(),
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });
  });
});
