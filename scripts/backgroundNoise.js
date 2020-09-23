const AssetToken = artifacts.require("AssetToken")
const { getArgument } = require("./utils_deployment")

const methods = ["issue", "burn", "transfer", "allow", "deny", "authorize"]
const MAX_AMOUNT = 1000

let tokenInstance

const fund = async (from, to, amount) => {
    console.log("About to fund", amount, "tokens", "to address", to)
    const tx = await tokenInstance.fund(to, amount, {from})
    console.log("tx", tx.receipt.transactionHash)
}

const transfer = async (from, to, amount) => {
    console.log("About to transfer", amount, "tokens", "from address", from, "to address", to)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.send(to, amount, data, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const burn = async (from, amount) => {
    console.log("About to burn", amount, "tokens", "from address", from)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.burn(amount, data, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const allow = async (who, from) => {
    console.log("About to allow address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const deny = async (who, from) => {
    console.log("About to deny address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const shuffleMethod = () => {
    return methods[Math.floor(Math.random() * (methods.length))]
}

const shuffleAccount = (accounts) => {
    return accounts[Math.floor(Math.random()* (accounts.length))]
}

const shuffleAmount = () => {
    return Math.floor(Math.random() * (MAX_AMOUNT))
}

// ENTRY POINT 
module.exports = async callback => {

    const tokenAddr = getArgument("--tokenAddr")

    try{

        tokenInstance = await AssetToken.at(tokenAddr)
        console.log("----- Interacting with Asset Token at", tokenAddr)

        const accounts = await web3.eth.getAccounts()
        console.log("----- Available accounts:\n", accounts)

        // randomly select what function is called
        switch(shuffleMethod()){
            case "issue":
                await fund(shuffleAccount(accounts), shuffleAccount(accounts), shuffleAmount())
                break
            case "transfer":
                await transfer(shuffleAccount(accounts), shuffleAccount(accounts), shuffleAmount())
            case "burn":
                await burn(shuffleAccount(accounts), shuffleAmount())
            case "allow":
                await allow(shuffleAccount(accounts), shuffleAccount(accounts))
            case "deny":
                await deny(shuffleAccount(accounts), shuffleAccount(accounts))
            default:
                console.log("No function called")
        }

    }catch(e){
        console.log(e)
        callback(e)
    }

    callback()
}