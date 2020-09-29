const AssetToken = artifacts.require("AssetToken")
const { getArgument } = require("./utils_deployment")

const methods = ["issue", "burn", "transfer", "allow", "deny", "authorize", "revoke"]
const MAX_AMOUNT = 1000
const INTERVAL = 1000 //ms

let tokenInstance, tokenIssuer, tokenAddr, accounts, interval, max_amount

const fund = async (from, to, amount) => {
    console.log("\n----- About to fund", amount, "tokens", "to address", to)
    const tx = await tokenInstance.fund(to, amount, {from})
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const transfer = async (from, to, amount) => {
    console.log("\n----- About to transfer", amount, "tokens", "from address", from, "to address", to)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.send(to, amount, data, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const burn = async (from, amount) => {
    console.log("\n----- About to burn", amount, "tokens", "from address", from)
    const data = web3.utils.randomHex(10);
    const tx = await tokenInstance.burn(amount, data, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const allow = async (who, from) => {
    console.log("\n----- About to allow address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const deny = async (who, from) => {
    console.log("\n----- About to deny address", who, "to move out tokens")

    const tx = await tokenInstance.allowAddress(who, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const authorizeOperator = async (operator, from) => {
    console.log("\n----- About to authorize operator", operator, "for", from)

    const tx = await tokenInstance.authorizeOperator(operator, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const revokeOperator = async (operator, from) => {
    console.log("\n----- About to revoke operator", operator, "for", from)

    const tx = await tokenInstance.revokeOperator(operator, { from })
    console.log("----- Tx Hash", tx.receipt.transactionHash)
}

const shuffleMethod = () => {
    return methods[Math.floor(Math.random() * (methods.length))]
}

const shuffleAccount = (accounts) => {
    return accounts[Math.floor(Math.random()* (accounts.length))]
}

const shuffleAmount = () => {
    return Math.floor(Math.random() * (max_amount))
}

const sendRepeteadRandomTx = async () => {

    setTimeout(async () => {
        try{
    
            method = methods.includes(defaultMethod) ? defaultMethod : shuffleMethod()
            switch(method){
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

        setTimeout(sendRepeteadRandomTx, interval)
    }, interval)
    
} 

// ENTRY POINT 
module.exports = async callback => {

    tokenAddr = getArgument("--tokenAddr") || "0x3332522639c7048c8A5fCe9F687DFc2fd44B02d4"
    max_amount = getArgument("--maxAmount") || MAX_AMOUNT
    interval = getArgument("--interval") || INTERVAL
    defaultMethod = getArgument("--method") || undefined

    try {
        tokenInstance = await AssetToken.at(tokenAddr)
        console.log("----- Interacting with Asset Token at", tokenAddr)
    }catch(e){
        console.log(e)
        process.exit()
    }
      
    tokenIssuer = await tokenInstance.owner()
    console.log("----- The Token Issuer is", tokenIssuer)

    accounts = await web3.eth.getAccounts()
    console.log("----- Available accounts:\n", accounts)

    if (!accounts.includes(tokenIssuer)){
        console.log("----- The Issuer Account is not part of the set of unlocked accounts, must return")
        process.exit()
    }

    await sendRepeteadRandomTx()
}