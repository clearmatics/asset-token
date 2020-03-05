// Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);
const AssetToken = artifacts.require("AssetToken");

let CONTRACT;

contract("Asset Token", accounts => {
  let totalSupplyInitial,
    balanceInitial,
    balanceFinal,
    actualError = null,
    errorMsg =
      "Error: Returned error: VM Exception while processing transaction: revert The amount must be a multiple of granularity";
  let totalSupplyFinal,
    wrongAmount = 10,
    victim = accounts[3],
    defaultOperator = accounts[4];

  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  const data = web3.utils.randomHex(0);

  describe("Operations not respecting granularity", () => {
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);

      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 3]
      // });

      // CONTRACT = PROXY.methods;

      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 3], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 3);

      await CONTRACT.fund(victim, 30, { from: addrOwner })

      balanceInitial = await CONTRACT.balanceOf(victim);
      assert.equal(balanceInitial, 30);

      totalSupplyInitial = await CONTRACT.totalSupply();
      assert.equal(totalSupplyInitial, 30);
    });

    describe("Burning tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.burn(wrongAmount, data, { from: victim })
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim);
        assert.deepEqual(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply();
        assert.deepEqual(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString().split(" --")[0], errorMsg);
      });

      it("Operator burn reject, keep state", async () => {
        try {
          await CONTRACT.operatorBurn(victim, wrongAmount, data, data, {
            from: defaultOperator
          })
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim);
        assert.deepEqual(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply();
        assert.deepEqual(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString().split(" --")[0], errorMsg);

      });
    });
    describe("Funding tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.fund(victim, wrongAmount, {
            from: addrOwner
          })
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim);
        assert.deepEqual(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply();
        assert.deepEqual(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString().split(" --")[0], errorMsg);
      });
    });
    describe("Sending tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.send(accounts[9], wrongAmount, data, {
            from: victim
          })
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim);
        assert.deepEqual(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply();
        assert.deepEqual(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString().split(" --")[0], errorMsg);
      });

      it("Operator send reject transaction, keep state", async () => {
        try {
          await CONTRACT.operatorSend(
            victim,
            accounts[9],
            wrongAmount,
            data,
            data, {
              from: defaultOperator
            }
          )
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim);
        assert.deepEqual(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply();
        assert.deepEqual(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString().split(" --")[0], errorMsg);
      });
    });
  });

  describe("Burning tokens with granularity 500", async () => {
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);

      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 500]
      // });

      // CONTRACT = PROXY.methods;

      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 500);

      await CONTRACT.fund(victim, 3000, { from: addrOwner })

      balanceInitial = await CONTRACT.balanceOf(victim);
      assert.deepEqual(parseInt(balanceInitial), 3000);
    });

    it("Reject transaction as it is not rounded to granularity, keep state", async () => {
      try {
        let wrongAmount1 = 365;
        await CONTRACT.burn(wrongAmount1, data, { from: victim })
      } catch (err) {
        actualError = err;
      }

      balanceFinal = await CONTRACT.balanceOf(victim);
      assert.deepEqual(balanceInitial, balanceFinal);
    });

  });










});
