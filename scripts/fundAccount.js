const AssetToken = artifacts.require("AssetToken")

module.exports = async function(callback) {
  const assetTokenAddr = '0xde09e74d4888bc4e65f589e8c13bce9f71ddf4c7'
  const instance = await AssetToken.at(assetTokenAddr)

  const accounts = web3.eth.accounts
  const cbAccount = accounts[0]

  const txConf = { from: cbAccount }
  const amount = 100

  const fundTxPromise = accounts.slice(1).map(acc => instance.fund(acc, amount, txConf))
  const fundTx = await Promise.all(fundTxPromise)
  console.log(fundTx)
}
