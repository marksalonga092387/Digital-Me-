// applicants.js

const mongo = require('mongodb').MongoClient
const express = require('express')
const securer = require('./securer')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const serveindex = require('serve-index')
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
    login: login,
    saveDocument: saveDocument,
    getValidDocuments: getValidDocuments,
    getInvalidDocuments: getValidDocuments,
    countInvalidDocuments: countInvalidDocuments,
    addNewExperience: addNewExperience,
    getExperiences: getExperiences,
    saveCertificate: saveCertificate,
    getCertificates: getCertificates,
    addSkill: addSkill,
    getSkills: getSkills,
    addLanguageProficiency: addLanguageProficiency,
    getLanguageProficiencies: getLanguageProficiencies,
    getActiveAnnouncements: getActiveAnnouncements
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
                token: securer.tokenize("applicant", walletAddress),
                resetPasscode: Math.floor(Math.random()*1000001),
                views: 0,
                salaryFilterSwitch: true,
                locationFilterSwitch: true,
                locationFilter: location,
                skillsFilterSwitch: true
            }
            var insertion = db.collection('applicants').insertOne(applicant, (err, result) => {
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
                    // APPLICANT INSERT IN BLOCKCHAIN
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
            var query = {emailAddress: emailAddress, exists: true}
            db.collection("applicants").find(query).toArray(function(err, result) {
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

async function saveDocument(walletAddress, date, doctype, filename) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                reject(err)
            }
            db = con.db('digitalme')
            var document = {
                id: walletAddress+"-"+doctype,
                walletAddress: walletAddress,
                doctype: doctype,
                filename: filename,
                uploadDate: date,
                valid: true
            }
            var old_document = {
                id: walletAddress + "-" + doctype + "-invalid",
                valid: false
            }
            db.collection('applicants_documents').update({id: walletAddress + "-" + doctype }, {$set: old_document});
            var insertion = db.collection('applicants_documents').update({id: walletAddress+"-"+doctype}, document, {upsert: true, safe: false}, (err, result) => {
                if (err !== null) {
                    return reject(err)
                } else {
                    return resolve(filename)
                }
            })
        })
    })
}

async function getValidDocuments(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress, valid: true}
            db.collection("applicants_documents").find(query).sort({uploadDate: -1}).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function getInvalidDocuments(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress, valid: true}
            db.collection("applicants_documents").find(query).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function countInvalidDocuments(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress, valid: false}
            db.collection("applicants_documents").find(query).count(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function addNewExperience(walletAddress, date, companyName, position, startDate, endDate, country, monthlySalary, description) {
    console.log('asdadasd')
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                reject(err)
            }
            db = con.db('digitalme')
            var document = {
                id: walletAddress+"-"+date,
                walletAddress: walletAddress,
                companyName: companyName,
                position: position,
                startDate: (+new Date(startDate)).toString(),
                endDate: (+new Date(endDate)).toString(),
                country: country,
                monthlySalary: monthlySalary,
                description: description
            }
            var insertion = db.collection('applicants_experiences').insertOne(document, (err, result) => {
                if (err !== null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function getExperiences(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress}
            db.collection("applicants_experiences").find(query).sort({uploadDate: -1}).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function saveCertificate(walletAddress, certname, filename) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                reject(err)
            }
            db = con.db('digitalme')
            var document = {
                id: walletAddress+"-"+filename.split('-')[1],
                walletAddress: walletAddress,
                certname: certname,
                filename: filename,
                uploadDate: filename.split('-')[1],
                valid: true
            }
            var insertion = db.collection('applicants_certificates').insertOne(document, (err, result) => {
                if (err !== null) {
                    return reject(err)
                } else {
                    return resolve(filename)
                }
            })
        })
    })
}

async function getCertificates(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress}
            db.collection("applicants_certificates").find(query).sort({uploadDate: -1}).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function addSkill(walletAddress, skill) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                reject(err)
            }
            db = con.db('digitalme')
            var document = {
                id: walletAddress+"-"+skill,
                walletAddress: walletAddress,
                skill: skill
            }
            var insertion = db.collection('applicants_skills').insertOne(document, (err, result) => {
                if (err !== null) {
                    return reject(err)
                } else {
                    return resolve(document.id)
                }
            })
        })
    })
}

async function getSkills(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress}
            db.collection("applicants_skills").find(query).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function addLanguageProficiency(walletAddress, language, level) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err)
            {
                reject(err)
            }
            db = con.db('digitalme')
            var document = {
                id: walletAddress+"-"+language,
                walletAddress: walletAddress,
                language: language,
                level: level
            }
            var insertion = db.collection('applicants_language_proficiencies').insertOne(document, (err, result) => {
                if (err !== null) {
                    return reject(err)
                } else {
                    return resolve(document.id)
                }
            })
        })
    })
}

async function getLanguageProficiencies(walletAddress) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {walletAddress: walletAddress}
            db.collection("applicants_language_proficiencies").find(query).sort({uploadDate: -1}).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}

async function getActiveAnnouncements(language) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongourl, mongoopts, (err, con) => {
            if (err) reject(err)
            db = con.db('digitalme')
            var query = {language: language, active: true}
            db.collection("announcements").find(query).sort({date: -1}).toArray(function(err, result) {
                if (err != null) {
                    return reject(err)
                } else {
                    return resolve(result)
                }
            })
        })
    })
}