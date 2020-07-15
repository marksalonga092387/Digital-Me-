// logger.js

module.exports = {
    genLongTime: genLongTime,
    log: log,
    logError: logError,
    logSuccess: logSuccess,
    timeLeadZero: timeLeadZero,
    millisecondLeadZero: millisecondLeadZero
}

function genLongTime() {
    var d = new Date()
    return d.getMonth()+
        "-"+d.getDate()+
        "-"+d.getFullYear()+
        " "+timeLeadZero(d.getHours())+
        ":"+timeLeadZero(d.getMinutes())+
        ":"+timeLeadZero(d.getSeconds())+
        "."+Math.floor(d.getMilliseconds())
}

function log(message) {
    console.log("\x1b[0m"+this.genLongTime()+" -> "+message)
}

function logSuccess(message) {
    console.log("\x1b[32m"+this.genLongTime()+" -> "+message)
}

function logError(message) {
    console.log("\x1b[31m"+this.genLongTime()+" -> "+message)
}

function timeLeadZero(digit) {
    if (digit<10) {
        return "0" + digit
    } else {
        return digit
    }
}

function millisecondLeadZero(digit) {
    switch (digit.length) {
        case 3:
            return digit;
            break;

        case 2:
            return "0" + digit;
            break;

        case 1:
            return "00" + digit;
            break;
    }
}