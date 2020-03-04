var testHelpers = {

}

// return the event log of the event we want to search in a txReceipt
testHelpers.filterEvent = (txReceipt, eventName) => {
    let event = txReceipt.receipt.logs.filter(l => { 
        if (l.event === "Fund") 
            return l;
    })[0];
    
    return event;
}

module.exports = testHelpers