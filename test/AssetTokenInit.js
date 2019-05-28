// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken");

let CONTRACT;

contract("AssetTokenInit", accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];
  beforeEach(async () => {
    PROJECT = await TestHelper({ from: proxyOwner });

    //contains logic contract
    PROXY = await PROJECT.createProxy(UpgradeableAssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner]
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
    const expectedDecimals = 3;

    assert.strictEqual(parseInt(actualDecimals), expectedDecimals);
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
