// Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");

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

      PROJECT = await TestHelper({ from: proxyOwner });

      //contains logic contract
      PROXY = await PROJECT.createProxy(AssetToken, {
        initMethod: "initialize",
        initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 3]
      });

      CONTRACT = PROXY.methods;

      await CONTRACT.fund(victim, 30).send({ from: addrOwner });

      balanceInitial = await CONTRACT.balanceOf(victim).call();
      assert.equal(balanceInitial, 30);

      totalSupplyInitial = await CONTRACT.totalSupply().call();
      assert.equal(totalSupplyInitial, 30);
    });

    describe("Burning tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.burn(wrongAmount, data).send({ from: victim });
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim).call();
        assert.equal(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply().call();
        assert.equal(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString(), errorMsg);
      });

      it("Operator burn reject, keep state", async () => {
        try {
          await CONTRACT.operatorBurn(victim, wrongAmount, data, data).send({
            from: defaultOperator
          });
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim).call();
        assert.equal(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply().call();
        assert.equal(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString(), errorMsg);
      });
    });
    describe("Funding tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.fund(victim, wrongAmount).send({
            from: addrOwner
          });
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim).call();
        assert.equal(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply().call();
        assert.equal(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString(), errorMsg);
      });
    });
    describe("Sending tokens", () => {
      it("Reject transaction, keep state", async () => {
        try {
          await CONTRACT.send(accounts[9], wrongAmount, data).send({
            from: victim
          });
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim).call();
        assert.equal(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply().call();
        assert.equal(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString(), errorMsg);
      });

      it("Operator send reject transaction, keep state", async () => {
        try {
          await CONTRACT.operatorSend(
            victim,
            accounts[9],
            wrongAmount,
            data,
            data
          ).send({
            from: defaultOperator
          });
        } catch (err) {
          actualError = err;
        }

        balanceFinal = await CONTRACT.balanceOf(victim).call();
        assert.equal(balanceInitial, balanceFinal);

        totalSupplyFinal = await CONTRACT.totalSupply().call();
        assert.equal(totalSupplyInitial, totalSupplyFinal);

        assert.equal(actualError.toString(), errorMsg);
      });
    });
  });
});
