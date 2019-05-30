// Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken"); //need to build first

let PROXY, PROJECT;
let proxyAdminAddress;

contract("Proxy to upgradable token", async accounts => {
  const addrOwner = accounts[0];
  const proxyOwner = accounts[1];

  beforeEach(async () => {
    //contains all zos structure - implementations, dependencies and proxyAdmin contracts
    PROJECT = await TestHelper({ from: proxyOwner });

    //creates a new proxy
    PROXY = await PROJECT.createProxy(UpgradeableAssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token", addrOwner]
    });
  });

  it("Proxies to implementation contract", async () => {
    const name = await PROXY.methods.name().call();
    const symbol = await PROXY.methods.symbol().call();
    const decimal = await PROXY.methods.decimals().call();
    const value = web3.utils.toWei("1", "ether");
    const logicAddress = PROJECT.implementations.UpgradeableAssetToken.address;

    let errMsg;
    try {
      const result = await web3.eth.sendTransaction({
        from: accounts[1],
        to: PROXY.address,
        value
      });
    } catch (error) {
      errMsg = error;
    }
    assert.strictEqual(
      errMsg.toString(),
      "Error: Returned error: VM Exception while processing transaction: revert This contract does not support ETH"
    );

    assert.equal(name, "Asset Token");
    assert.equal(decimal, 3);
    assert.equal(symbol, "CLR");
    assert.notEqual(PROXY.address, logicAddress);
  });
});
