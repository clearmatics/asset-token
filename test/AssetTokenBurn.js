// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const {filterEvent} = require("./helpers") 
const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = artifacts.require("AssetToken");

let CONTRACT;

contract("Asset Token", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const data = web3.utils.randomHex(0);
  const zeroRegistryAddress = "0x0000000000000000000000000000000000000000"

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
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);

      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [], 1, 1]
      // });

      // CONTRACT = PROXY.methods;

      CONTRACT = await AssetToken.new({gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [], 1, 1, zeroRegistryAddress);

      addrRecipient = accounts[2];

      totalSupplyBefore = await CONTRACT.totalSupply();
      balanceRecipientBefore = await CONTRACT.balanceOf(addrRecipient);

      fundVal = 100;
      fundRes = await CONTRACT.fund(addrRecipient, fundVal, {
        from: addrOwner
      })

      totalSupplyFunded = await CONTRACT.totalSupply();
      balanceRecipientFunded = await CONTRACT.balanceOf(addrRecipient);
      actualError = null;

      fundEvent = filterEvent(fundRes, "Fund")
      fundEventVal = parseInt(fundEvent.args.value);
      fundEventBalance = parseInt(fundEvent.args.balance);
    });

    it("more tokens than in the account - reverts", async () => {
      try {
        const defundVal = parseInt(balanceRecipientFunded) + 50;
        const defundRes = await CONTRACT.burn(defundVal, data, {
          from: addrRecipient
        })
      } catch (error) {
        actualError = error;
      }

      const totalSupplyDefunded = await CONTRACT.totalSupply();
      const balanceRecipientDefunded = await CONTRACT.balanceOf(
        addrRecipient
      );

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
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert"
      );
    });

    it("correctly burn tokens", async () => {
      const defundVal = 50;
      const defundRes = await CONTRACT.burn(defundVal, data, {
        from: addrRecipient
      })

      const defundEvent = filterEvent(defundRes, "Burned")
      const defundEventVal = parseInt(defundEvent.args.amount);

      const totalSupplyDefunded = await CONTRACT.totalSupply();
      const balanceRecipientDefunded = await CONTRACT.balanceOf(
        addrRecipient
      );

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
      const balanceOwnerBefore = await CONTRACT.balanceOf(addrOwner);
      try {
        const defundVal = 50;
        await CONTRACT.burn(defundVal, data, {
          from: addrOwner
        })
      } catch (error) {
        actualError = error;
      }

      const totalSupplyDefunded = await CONTRACT.totalSupply();
      const balanceOwnerDefunded = await CONTRACT.balanceOf(addrOwner);

      assert.strictEqual(
        parseInt(totalSupplyFunded),
        parseInt(totalSupplyDefunded)
      );
      assert.strictEqual(
        parseInt(balanceOwnerBefore),
        parseInt(balanceOwnerDefunded)
      );
      assert.strictEqual(
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });
  });
});
