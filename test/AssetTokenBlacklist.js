// Copyright (c) 2019 Clearmatics Technologies Ltd

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
  const defaultOperator = accounts[9];
  const data = web3.utils.randomHex(0);

  describe("Controller delegation", () => {
    let delegate, res, error;
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);
      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1]
      // });

      // CONTRACT = PROXY.methods;

      // don't use the proxy or the coverage tool won't work
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1);

      delegate = accounts[2];

      res = await CONTRACT.setListsController(delegate, {from: addrOwner})

      error = null;
    });

    it("Delegation event triggered", async () => {
      const eventDel = filterEvent(res, "ListDelegation")
      assert.equal(eventDel.args.member, delegate);
    });

    it("Delegate account can't delegate", async () => {
      const thirdParty = accounts[3];
      try {
        await CONTRACT.setListsController(thirdParty, {from: delegate})
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert Only the contract owner can perform this operation"
      );
    });

    it("Delegate can't take part of a payment", async () => {
      const recipient = accounts[3];
      try {
        await CONTRACT.send(recipient, 10, data, {from: delegate})
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("Nor use an operator for a payment", async () => {
      const recipient = accounts[3];
      try {
        await CONTRACT.operatorSend(delegate, recipient, 10, data, data, {from: defaultOperator})
      } catch (err) {
        error = err;
      }

      assert.strictEqual(
        error.toString().split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert The contract owner can not perform this operation"
      );
    });

    it("Delegate can blacklist an address", async () => {
      const victim = accounts[4];

      await CONTRACT.denyAddress(victim, {from: delegate})

      const isAllowedToSend = await CONTRACT.isAllowedToSend(victim);
      assert.equal(isAllowedToSend, false);
    });

    it("Revokes delegation", async () => {
      const tx = await CONTRACT.setListsController(addrOwner, {from: addrOwner})

      const eventDel = filterEvent(tx, "ListDelegation")
      assert.equal(eventDel.args.member, addrOwner);
    });
  });

  describe("Blacklist mode", () => {
    beforeEach(async () => {
      this.erc1820 = await singletons.ERC1820Registry(addrOwner);
      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1]
      // });

      // CONTRACT = PROXY.methods;

      // don't use the proxy or the coverage tool won't work
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1);
    });

    it("Accounts are allowed by default", async () => {
      for (let i = 0; i < accounts.length; i++) {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(
          accounts[i]
        );
        assert.equal(isAllowedToSend, true);
      }
    });

    context("Blacklisting an account", async () => {
      let denyEvent,
        allowedEvent = null,
        victim;
      beforeEach(async () => {
        victim = accounts[3];
        const res = await CONTRACT.denyAddress(victim, {from:addrOwner})

        denyEvent = filterEvent(res, "Denied")
      });

      it("Not allowed to send anymore", async () => {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(victim);
        assert.equal(isAllowedToSend, false);
      });

      it("Emits Denied event", () => {
        assert.notEqual(denyEvent, null);
        assert.equal(denyEvent.args.who, victim);
        assert.equal(denyEvent.args.status, 1);
      });

      context("Payment operations", () => {
        let addrRecipient, fundVal, actualError;
        beforeEach(async () => {
          addrRecipient = accounts[4];
          fundVal = 100;
          actualError = null;

          await CONTRACT.fund(victim, fundVal, {from: addrOwner})
        });

        it("Send operation is reverted", async () => {
          try {
            await CONTRACT.send(addrRecipient, fundVal, data, {from: victim})
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString().split(" --")[0].split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });

        it("OperatorSend on behalf of blacklisted account is reverted", async () => {
          try {
            await CONTRACT.operatorSend(
              victim,
              addrRecipient,
              fundVal,
              data,
              data, {from: defaultOperator}
            )
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString().split(" --")[0].split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });

        it("OperatorSend by a blacklisted operator is reverted", async () => {
          await CONTRACT.denyAddress(defaultOperator, {from: addrOwner})

          try {
            await CONTRACT.operatorSend(
              accounts[5],
              addrRecipient,
              fundVal,
              data,
              data, {from: defaultOperator}
            )
          } catch (err) {
            actualError = err;
          }

          assert.equal(
            actualError.toString().split(" --")[0].split(" --")[0],
            "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
          );
        });
      });

      context("Allow that account again", async () => {
        beforeEach(async () => {
          const res = await CONTRACT.allowAddress(victim, {from: addrOwner})

          allowedEvent = filterEvent(res, "Allowed");
        });

        it("Allowed to send again", async () => {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(victim);
          assert.equal(isAllowedToSend, true);
        });

        it("Emits Allowed event", () => {
          assert.equal(allowedEvent.args.who, victim);
          assert.equal(allowedEvent.args.status, 1);
        });
      });
    });

    context("Switching to whitelist", () => {
      let switchEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.switchListStatus(2, {from: addrOwner})
        
        switchEvent = filterEvent(res, "SwitchListStatus")
      });
      it("Emits switch event correctly", () => {
        assert.notEqual(switchEvent, undefined || null);
        assert.equal(switchEvent.args.status, 2);
      });
      it("Accounts are not allowed anymore", async () => {
        for (let i = 0; i < accounts.length; i++) {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(
            accounts[i]
          );
          assert.equal(isAllowedToSend, false);
        }
      });
    });
  });

  describe("Whitelist mode", () => {
    beforeEach(async () => {
      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 2, 1]
      // });

      // CONTRACT = PROXY.methods;

      // don't use the proxy or the coverage tool won't work
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 2, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 2, 1, {from: addrOwner, gas: 100000000});
    
    });

    it("Accounts are not allowed by default", async () => {
      for (let i = 0; i < accounts.length; i++) {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(
          accounts[i]
        );
        assert.equal(isAllowedToSend, false);
      }
    });

    context("Payment operations", () => {
      let addrRecipient, fundVal, actualError, addrSender;
      beforeEach(async () => {
        addrRecipient = accounts[4];
        addrSender = accounts[3];
        fundVal = 100;
        actualError = null;

        await CONTRACT.fund(addrSender, fundVal, {from:addrOwner})
      });

      it("Send operation is reverted", async () => {
        try {
          await CONTRACT.send(addrRecipient, fundVal, data, {from:addrSender})
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString().split(" --")[0].split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });

      it("OperatorSend on behalf of unallowed account is reverted", async () => {
        try {
          await CONTRACT.operatorSend(
            addrSender,
            addrRecipient,
            fundVal,
            data,
            data, {from: defaultOperator}
          )
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString().split(" --")[0].split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });

      it("OperatorSend by an unallowed operator is reverted", async () => {
        await CONTRACT.denyAddress(defaultOperator, {from: addrOwner})

        try {
          await CONTRACT.operatorSend(
            accounts[5],
            addrRecipient,
            fundVal,
            data,
            data, {from: defaultOperator}
          )
        } catch (err) {
          actualError = err;
        }

        assert.equal(
          actualError.toString().split(" --")[0].split(" --")[0],
          "Error: Returned error: VM Exception while processing transaction: revert This account is not allowed to send money"
        );
      });
    });

    context("Whitelisting an account", () => {
      const victim = accounts[8];
      let allowedEvent,
        denyEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.allowAddress(victim, {from: addrOwner})

        allowedEvent = filterEvent(res, "Allowed");
      });

      it("He is now allowed to send", async () => {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(victim);
        assert.equal(isAllowedToSend, true);
      });

      it("Emits Allowed event", async () => {
        assert.equal(allowedEvent.args.who, victim);
        assert.equal(allowedEvent.args.status, 2);
      });

      context("Deny that account again", async () => {
        beforeEach(async () => {
          const res = await CONTRACT.denyAddress(victim, {from: addrOwner})

          denyEvent = filterEvent(res, "Denied")
        });

        it("Not allowed to send anymore", async () => {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(victim);
          assert.equal(isAllowedToSend, false);
        });

        it("Emits Denied event", () => {
          assert.equal(denyEvent.args.who, victim);
          assert.equal(denyEvent.args.status, 2);
        });
      });
    });

    context("Switching to blacklist", () => {
      let switchEvent = null;
      beforeEach(async () => {
        const res = await CONTRACT.switchListStatus(1, {from: addrOwner})
        switchEvent = filterEvent(res, "SwitchListStatus")
      });
      it("Emits switch event correctly", () => {
        assert.notEqual(switchEvent, undefined || null);
        assert.equal(switchEvent.args.status, 1);
      });
      it("Accounts are now all allowed", async () => {
        for (let i = 0; i < accounts.length; i++) {
          const isAllowedToSend = await CONTRACT.isAllowedToSend(
            accounts[i]
          );
          assert.equal(isAllowedToSend, true);
        }
      });
    });
  });

  describe("No filter mode", () => {
    let actualError;
    beforeEach(async () => {
      // this.erc1820 = await singletons.ERC1820Registry(addrOwner);
      // PROJECT = await TestHelper({ from: proxyOwner });

      // //contains logic contract
      // PROXY = await PROJECT.createProxy(AssetToken, {
      //   initMethod: "initialize",
      //   initArgs: ["CLR", "Asset Token", addrOwner, [defaultOperator], 0, 1]
      // });

      // CONTRACT = PROXY.methods;

      // don't use the proxy or the coverage tool won't work
      CONTRACT = await AssetToken.new(["CLR", "Asset Token", addrOwner, [defaultOperator], 1, 1], {gas: 100000000});

      // call the constructor 
      await CONTRACT.initialize("CLR", "Asset Token", addrOwner, [defaultOperator], 0, 1);
      
      actualError = null;
    });

    it("Accounts are allowed by default", async () => {
      for (let i = 0; i < accounts.length; i++) {
        const isAllowedToSend = await CONTRACT.isAllowedToSend(
          accounts[i]
        );
        assert.equal(isAllowedToSend, true);
      }
    });

    it("Not possible to deny an account", async () => {
      try {
        let victim = accounts[3];
        const res = await CONTRACT.denyAddress(victim, {from:addrOwner})
      } catch (err) {
        actualError = err;
      }

      assert.equal(
        actualError.toString().split(" --")[0].split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert You must do either in white or black listing status"
      );
    });

    it("Nor to allow an account", async () => {
      try {
        let victim = accounts[3];
        const res = await CONTRACT.allowAddress(victim, {from: addrOwner})
      } catch (err) {
        actualError = err;
      }

      assert.equal(
        actualError.toString().split(" --")[0].split(" --")[0],
        "Error: Returned error: VM Exception while processing transaction: revert You must do either in white or black listing status"
      );
    });
  });
});
