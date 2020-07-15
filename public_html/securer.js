// securer.js

const passwordHash = require('password-hash')

module.exports = {
    hashpassword: hashpassword,
    tokenize: tokenize,
    confirmpassword: confirmpassword
}

function hashpassword(password) {
    return passwordHash.generate(password)
}

function confirmpassword(password, hashedpassword) {
    return passwordHash.verify(password, hashedpassword)
}

function tokenize(accountType, stringToToken) {
    return "$"+accountType+'-'+passwordHash.generate(accountType).substr(5)
}