// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const { singletons } = require("openzeppelin-test-helpers");
const {filterEvent} = require("./helpers") 

ZWeb3.initialize(web3.currentProvider);

const AssetToken = artifacts.require("AssetToken");

let CONTRACT;

contract("AssetToken", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const data = web3.utils.randomHex(0);

  beforeEach(async () => {
    this.erc1820 = await singletons.ERC1820Registry(addrOwner);

    // PROJECT = await TestHelper({ from: proxyOwner });

    // //contains logic contract
    // PROXY = await PROJECT.createProxy(AssetToken, {
    //   initMethod: "initialize",
    //   initArgs: ["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1]
    // });

    // don't use the proxy or the coverage tool won't work
    CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1], {gas: 100000000});

    // call the constructor 
    await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1);
  });

  describe("Funding operations", () => {
    it("funds an account", async () => {
      const addrRecipient = accounts[2];

      const totalSupplyBefore = await CONTRACT.totalSupply();

      const balanceRecipientBefore = await CONTRACT.balanceOf(
        addrRecipient
      )

      const fundVal = 100;
      const fundRes = await CONTRACT.fund(addrRecipient, fundVal)

      const fundEvent = filterEvent(fundRes, "Fund")
      const fundEventVal = parseInt(fundEvent.args.value);
      const fundEventBalance = parseInt(fundEvent.args.balance);

      const totalSupplyAfter = await CONTRACT.totalSupply()
      const balanceRecipientAfter = await CONTRACT.balanceOf(
        addrRecipient
      )

      assert(fundEvent != null);
      assert.strictEqual(fundVal, fundEventVal);
      assert.strictEqual(
        parseInt(balanceRecipientBefore) + fundVal,
        fundEventBalance
      );
      assert.strictEqual(
        parseInt(totalSupplyBefore) + fundVal,
        parseInt(totalSupplyAfter)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore) + fundVal,
        parseInt(balanceRecipientAfter)
      );
    });

    it("attempt to Fund when not the contract owner nor delegated one", async () => {
      const addrRecipient = accounts[2];

      const totalSupplyBefore = await CONTRACT.totalSupply();
      const balanceRecipientBefore = await CONTRACT.balanceOf(
        addrRecipient
      );

      let actualError = null;
      try {
        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, {from: addrRecipient})
      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfter = await CONTRACT.totalSupply();
      const balanceRecipientAfter = await CONTRACT.balanceOf(
        addrRecipient
      );

      assert.strictEqual(
        parseInt(totalSupplyBefore),
        parseInt(totalSupplyAfter)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore),
        parseInt(balanceRecipientAfter)
      );
      assert.strictEqual(
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
      );
    });

    it("attempt to Fund the contract owner", async () => {
      const totalSupplyBefore = await CONTRACT.totalSupply();
      const balanceRecipientBefore = await CONTRACT.balanceOf(addrOwner);

      let actualError = null;
      try {
        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrOwner, fundVal)

      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfter = await CONTRACT.totalSupply();
      const balanceRecipientAfter = await CONTRACT.balanceOf(addrOwner);

      assert.strictEqual(
        parseInt(totalSupplyBefore),
        parseInt(totalSupplyAfter)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore),
        parseInt(balanceRecipientAfter)
      );
      assert.strictEqual(
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("attempt to Fund the delegate account", async () => {
      const totalSupplyBefore = await CONTRACT.totalSupply();
      const balanceRecipientBefore = await CONTRACT.balanceOf(addrOwner);
      const delegate = accounts[2];

      await CONTRACT.setFundingPermission(delegate)

      let actualError = null;
      try {
        const fundVal = 100;
        const fundRes = await CONTRACT.fund(delegate, fundVal, {from:delegate})

      } catch (error) {
        actualError = error;
      }

      const totalSupplyAfter = await CONTRACT.totalSupply();
      const balanceRecipientAfter = await CONTRACT.balanceOf(addrOwner);

      assert.strictEqual(
        parseInt(totalSupplyBefore),
        parseInt(totalSupplyAfter)
      );
      assert.strictEqual(
        parseInt(balanceRecipientBefore),
        parseInt(balanceRecipientAfter)
      );
      assert.strictEqual(
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    context("Funding delegation", () => {
      it("funding delegate is able to fund", async () => {
        const delegate = accounts[2];
        const addrRecipient = accounts[3];

        await CONTRACT.setFundingPermission(delegate)

        const totalSupplyBefore = await CONTRACT.totalSupply();
        const balanceRecipientBefore = await CONTRACT.balanceOf(
          addrRecipient
        );

        const fundVal = 100;

        const fundRes = await CONTRACT.fund(addrRecipient, fundVal, {from: delegate})

        const fundEvent = filterEvent(fundRes, "Fund")
        
        const fundEventVal = parseInt(fundEvent.args.value);
        const fundEventBalance = parseInt(fundEvent.args.balance);

        const totalSupplyAfter = await CONTRACT.totalSupply();
        const balanceRecipientAfter = await CONTRACT.balanceOf(
          addrRecipient
        );

        assert(fundEvent != null);
        assert.strictEqual(fundVal, fundEventVal);
        assert.strictEqual(
          parseInt(totalSupplyBefore) + fundVal,
          parseInt(totalSupplyAfter)
        );
        assert.strictEqual(
          parseInt(balanceRecipientBefore) + fundVal,
          parseInt(balanceRecipientAfter)
        );
        assert.strictEqual(
          parseInt(balanceRecipientBefore) + fundVal,
          parseInt(fundEventBalance)
        );
      });

      it("revoked account is not able to fund", async () => {
        const delegate = accounts[2];
        const addrRecipient = accounts[3];
        const fundVal = 100;
        let error = null;

        await CONTRACT.setFundingPermission(delegate)
        await CONTRACT.setFundingPermission(addrOwner)

        try {
          await CONTRACT.fund(addrRecipient, fundVal, {from: delegate})
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString().split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
        );
      });

      it("owner is not able to fund once has delegated", async () => {
        const delegate = accounts[2];
        const addrRecipient = accounts[3];
        const fundVal = 100;
        let error = null;
        await CONTRACT.setFundingPermission(delegate)

        try {
          await CONTRACT.fund(addrRecipient, fundVal)
        } catch (err) {
          error = err;
        }

        assert.strictEqual(
          error.toString().split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to do this"
        );
      });

      it("delegate is not able to make payments", async () => {
        const delegate = accounts[2];
        const recipient = accounts[3];
        let error = null;
        await CONTRACT.setFundingPermission(delegate)
        try {
          const res = await CONTRACT.send(recipient, 10, data, {from: delegate})
        } catch (err) {
          error = err;
        }
        assert.strictEqual(
          error.toString().split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
        );
      });
    });
  });
});
