// Copyright (c) 2019-2020 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { TestHelper } = require("zos"); //function to retrieve zos project structure object
const { Contracts, ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts

ZWeb3.initialize(web3.currentProvider);

const UpgradeableAssetToken = Contracts.getFromLocal("UpgradeableAssetToken"); //need to build first

let PROXY, PROJECT;

contract("Proxy token init", accounts => {
  const owner = accounts[0];
  beforeEach(async () => {
    PROJECT = await TestHelper({ from: owner });

    PROXY = await PROJECT.createProxy(UpgradeableAssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token"]
    });
  });

  it("correctly proxies to implementation contract", async () => {
    const name = await PROXY.methods.name().call();
    const symbol = await PROXY.methods.symbol().call();
    const decimal = await PROXY.methods.decimals().call();
    const value = web3.utils.toWei("1", "ether");

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
  });

  // TODO:
  /*
  it("Sets specified account as proxy admin", async () => {
    console.log(await PROJECT.getAdminAddress());
    await PROJECT.changeProxyAdmin(PROXY.address.toString(), owner.toString());
    console.log(await PROJECT.getAdminAddress());
  });*/

  it("create two different proxies", async () => {
    const secondProxy = await PROJECT.createProxy(UpgradeableAssetToken, {
      initMethod: "initialize",
      initArgs: ["CLR", "Asset Token"]
    });

    const name = await secondProxy.methods.name().call();

    assert.equal(name, "Asset Token");
    assert.notEqual(PROXY.address, secondProxy.address);
  });

  //TODO
  /*
  it("Updates implementation contract", async () => {
    const oldAddress = await PROXY.address;

    console.log(await PROJECT.upgradeProxy(PROXY, UpdatedToken));

    const newAddress = await PROXY.address;

    assert.notEqual(oldAddress, newAddress);
  }); */
});
