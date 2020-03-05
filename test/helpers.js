var testHelpers = {

}

// return the event log of the event we want to search in a txReceipt
testHelpers.filterEvent = (txReceipt, eventName) => {
    let event = txReceipt.receipt.logs.filter(l => { 
        if (l.event === eventName) 
            return l;
    })[0];
    
    return event || undefined;
}

module.exports = testHelpers