const AssetToken = artifacts.require("AssetToken")
const { getArgument } = require("./utils_deployment")

const methods = ["issue", "burn", "transfer", "allow", "deny", "authorize", "revoke"]
const MAX_AMOUNT = 1000
const INTERVAL = 1000 //ms

let tokenInstance, tokenIssuer, tokenAddr, accounts

const fund = async (from, to, amount) => {
    console.log("----- About to fund", amount, "tokens", "to address", to)
    const tx = await tokenInstance.fund(to, amount, {from})
    console.log("tx", tx.receipt.transactionHash)
}

const transfer = async (from, to, amount) => {
    console.log("----- About to transfer", amount, "tokens", "from address", from, "to address", to)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.send(to, amount, data, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const burn = async (from, amount) => {
    console.log("----- About to burn", amount, "tokens", "from address", from)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.burn(amount, data, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const allow = async (who, from) => {
    console.log("----- About to allow address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const deny = async (who, from) => {
    console.log("----- About to deny address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const authorizeOperator = async (operator, from) => {
    console.log("----- About to authorize operator", operator, "for", from)

    const tx = await tokenInstance.authorizeOperator(operator, { from })
    console.log("tx", tx.receipt.transactionHash)
}

const revokeOperator = async (operator, from) => {
    console.log("----- About to revoke operator", operator, "for", from)

    const tx = await tokenInstance.revokeOperator(operator, { from })
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

const sendRepeteadRandomTx = async () => {

    setTimeout(async () => {
        try{
    
            // randomly select what function is called
            switch(method = shuffleMethod()){
                case "issue":
                    await fund(tokenIssuer, shuffleAccount(accounts), shuffleAmount())
                    break
                case "transfer":
                    await transfer(shuffleAccount(accounts), shuffleAccount(accounts), shuffleAmount())
                    break
                case "burn":
                    await burn(shuffleAccount(accounts), shuffleAmount())
                    break
                case "allow":
                    await allow(shuffleAccount(accounts), tokenIssuer)
                    break
                case "deny":
                    await deny(shuffleAccount(accounts), tokenIssuer)
                    break
                case "authorize":
                    await authorizeOperator(shuffleAccount(accounts), shuffleAccount(accounts))
                    break
                case "revoke":
                    await revokeOperator(shuffleAccount(accounts), shuffleAccount(accounts))
                    break
                default:
                    console.log("This method is not present:", method)
            }            
    
        }catch(e){
            console.log(e)
        }

        setTimeout(sendRepeteadRandomTx, INTERVAL)
    }, INTERVAL)
    
} 

// ENTRY POINT 
module.exports = async callback => {

    tokenAddr = getArgument("--tokenAddr")
            
    tokenInstance = await AssetToken.at(tokenAddr)
    console.log("----- Interacting with Asset Token at", tokenAddr)

    tokenIssuer = await tokenInstance.owner()

    accounts = await web3.eth.getAccounts()
    console.log("----- Available accounts:\n", accounts)

    await sendRepeteadRandomTx()
}