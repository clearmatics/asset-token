const commandLineArgs = require('command-line-args')

const flags = [
    { name: "network", type: String},
    { name: "privateKey", type: String},
    { name: "nodeURL", type:String},
    { name: "tokenAddr", type:String},
    { name: "maxAmount", type: String},
    { name: "interval", type: String},
    { name: "method", type: String},
    { name: "url", type: String}
]

const options = commandLineArgs(flags, {partial: true}) //allow for unknown options

const getArgument = (flag) => {
    let f = flag.substr(2)
    return(options[f])
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports={getArgument, sleep}

