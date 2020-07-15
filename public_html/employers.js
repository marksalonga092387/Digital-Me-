// applicants.js

const mongo = require('mongodb').MongoClient
const express = require('express')
const securer = require('./securer')
const session = require('express-session')
const serveindex = require('serve-index')
const MongoStore = require('connect-mongo')(session);
const logger = require('./logger')
const app = express()
var mongourl = "mongodb://localhost:27017"
var mongoopts = { useUnifiedTopology: true }

var db


app.use(session({
    secret: "digitalMeSecretString",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30 * 3 // 3 Months
    },
    store: new MongoStore({ url: 'mongodb://localhost:27017/digitalme' })
}))



module.exports = {
    apply: apply,
    hasDuplicates: hasDuplicates,
    login: login
}

// Async Functions

async function apply(walletAddress, emailAddress, password, contact_number, name, physicalAddress, nationality, location, salaryFlooring = 0, salaryCeiling = 0, exists = true, nameChanges = 0) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                logger.logError(walletAddress + " is not added as an applicant, an error has occured.")
                reject(err)
            }
            db = con.db('digitalme')
            var applicant = {
                walletAddress: walletAddress,
                emailAddress: emailAddress,
                password: securer.hashpassword(password),
                contact_number: contact_number,
                name: name,
                nameChanges: nameChanges,
                physicalAddress: physicalAddress,
                nationality: nationality,
                location: location,
                exists: exists,
                salaryFlooring: salaryFlooring,
                salaryCeiling: salaryCeiling,
                token: securer.tokenize("employer", walletAddress),
                resetPasscode: Math.floor(Math.random()*1000001),
                views: 0,
                salaryFilterSwitch: true,
                locationFilterSwitch: true,
                locationFilter: location,
                skillsFilterSwitch: true
            }
            var insertion = db.collection('employers').insertOne(applicant, (err, result) => {
                if (err !== null) {
                    var errorStatement
                    switch (err.code) {
                        case 11000:
                            errorStatement = walletAddress + " is not added as an applicant, duplicates found."
                    }
                    logger.logError(errorStatement)
                    return reject(err)
                } else {
                    logger.logSuccess(walletAddress + " has been added as an applicant.")
                    // TODO: APPLICANT INSERT IN BLOCKCHAIN
                    return resolve(true)
                }
            })
        })
    })
}

async function hasDuplicates(walletAddress, emailAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = { $or: [{ walletAddress: walletAddress }, { emailAddress: emailAddress }] }
            db.collection("applicants").find(query).toArray(function(err, result) {
                if (err != null) {
                    logger.logError("An error has occured in finding duplicates for ("+walletAddress+") and "+"("+emailAddress+")")
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function login(emailAddress, password) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {emailAddress: emailAddress}
            db.collection("employers").find(query).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    if (result.length!=1) {
                        return reject([])
                    } else {
                        if (password != "" && securer.confirmpassword(password, result[0].password)) {
                            delete result[0].password
                            return resolve(result[0])
                        } else {
                            return reject([])
                        }
                    }
                    return resolve(result)
                }
            })
        })
    })
}