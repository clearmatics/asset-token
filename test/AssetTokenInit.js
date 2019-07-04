// Copyright (c) 2017 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

const { singletons } = require("openzeppelin-test-helpers");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");

let CONTRACT;

contract("AssetTokenInit", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  beforeEach(async () => {
    this.erc1820 = await singletons.ERC1820Registry(addrOwner);

    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(AssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner, [accounts[2]], 1, 1]
    });

    CONTRACT = PROXY.methods;
  });

  it("name: Check the name of the token", async () => {
    const actualName = await CONTRACT.name().call();
    const expectedName = "Asset Token";

    assert.strictEqual(actualName, expectedName);
  });

  it("symbol: Check the tokens symbol", async () => {
    const actualSymbol = await CONTRACT.symbol().call();
    const expectedSymbol = "CLR";

    assert.strictEqual(actualSymbol, expectedSymbol);
  });

  it("decimals: Check the number of decimal place in the tokens", async () => {
    const actualDecimals = await CONTRACT.decimals().call();
    const expectedDecimals = 18;

    assert.strictEqual(parseInt(actualDecimals), expectedDecimals);
  });

  it("listStatus: Check the initial list status", async () => {
    const status = await CONTRACT.getListStatus().call();
    assert.equal(status, 1);
  });

  it("granularity: Check the granularity", async () => {
    const granularity = await CONTRACT.getListStatus().call();
    assert.equal(granularity, 1);
  });

  it("default operators: Set default operator", async () => {
    const defOperator = await CONTRACT.defaultOperators().call();
    assert.equal(defOperator, accounts[2]);
  });

  it("default: Attempt to send Eth to the contract", async () => {
    const weiToSend = web3.utils.toWei("1", "ether");

    let actualError = null;
    try {
      const result = await web3.eth.sendTransaction({
        to: PROXY.address,
        value: weiToSend,
        from: addrOwner
      });
    } catch (error) {
      actualError = error;
    }

    assert.strictEqual(
      actualError.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert This contract does not support ETH"
    );
  });
});
