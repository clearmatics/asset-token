// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);
const AssetToken = artifacts.require("AssetToken");

let CONTRACT;

contract("AssetTokenInit", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const zeroRegistryAddress = "0x0000000000000000000000000000000000000000"

  describe("Initialize with the default 1820 registry", () => {
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);
  
      // PROJECT = await TestHelper({ from: proxyOwner });
  
      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1]
      // });
  
      // CONTRACT = PROXY.methods;
      
      // don't use the proxy or the coverage tool won't work
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1, zeroRegistryAddress);
    });

    it("owner: Check the owner address", async () => {
      const actualOwner = await CONTRACT.owner();
  
      assert.strictEqual(actualOwner, addrOwner);
    });
  
    it("name: Check the name of the token", async () => {
      const actualName = await CONTRACT.name();
      const expectedName = "Asset Token";
  
      assert.strictEqual(actualName, expectedName);
    });
  
    it("symbol: Check the tokens symbol", async () => {
      const actualSymbol = await CONTRACT.symbol();
      const expectedSymbol = "CLR";
  
      assert.strictEqual(actualSymbol, expectedSymbol);
    });
  
    it("decimals: Check the number of decimal place in the tokens", async () => {
      const actualDecimals = await CONTRACT.decimals();
      const expectedDecimals = 18;
  
      assert.strictEqual(parseInt(actualDecimals), expectedDecimals);
    });
  
    it("listStatus: Check the initial list status", async () => {
      const status = await CONTRACT.getListStatus();
      assert.equal(status, 1);
    });
  
    it("granularity: Check the granularity", async () => {
      const granularity = await CONTRACT.getListStatus();
      assert.equal(granularity, 1);
    });
  
    it("default operators: Set default operator", async () => {
      const defOperator = await CONTRACT.defaultOperators();
      assert.equal(defOperator, accounts[2]);
    });

    it("default: Attempt to send Eth to the contract", async () => {
      const weiToSend = web3.utils.toWei("1", "ether");
  
      let actualError = null;
      try {
        const result = await web3.eth.sendTransaction({
          to: CONTRACT.address,
          value: weiToSend,
          from: addrOwner
        });
      } catch (error) {
        actualError = error;
      }
  
      assert.strictEqual(
        actualError.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert This contract does not support ETH"
      );
    });
  })

  describe("Initialize with a custom 1820 address which is not a valid 1820 registry", () => {
    it("Should fail the initialization", async () => {
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1], {gas: 100000000});
  
      // call the constructor 
      try{
        await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1, accounts[7]);
      } catch (err){
        assert.equal(err, "Error: Returned error: VM Exception while processing transaction: revert")
        return
      }

      assert.fail("The initialization should have been reverted")
    })
  })

});
