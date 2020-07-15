// CONSTANTS

const mongo = require('mongodb').MongoClient
const express = require('express')
const fileUpload = require('express-fileupload')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const serveIndex = require('serve-index')
const passwordHash = require('password-hash')
const applicants = require('./applicants')
const logger = require('./logger')
const moment = require('moment')
const languageProcessor = require('./languageProcessor')
const app = express()
const bodyParser = require('body-parser')
const multer = require('multer')
const port = process.env.port || 9000

var applicant_docs_storage = multer.diskStorage(
	{
		destination: 'apx_upd/docs',
		filename: function ( req, file, cb ) {
			//req.body is empty... here is where req.body.new_file_name doesn't exists
			console.log(file)
			cb( null, req.session.auth_applicant.walletAddress+"-"+Date.now()+"-"+req.body.doctype+"."+file.originalname.split(".").pop() );
		}
	}
);
const applicant_docs_upload = multer({ storage: applicant_docs_storage })

var applicant_certs_storage = multer.diskStorage(
	{
		destination: 'apx_upd/certs',
		filename: function ( req, file, cb ) {
			//req.body is empty... here is where req.body.new_file_name doesn't exists
			cb( null, req.session.auth_applicant.walletAddress+"-"+Date.now()+"-cert-"+file.originalname.split(".").pop() );
		}
	}
);
const applicant_certs_upload = multer({ storage: applicant_certs_storage })


// Localization
var lang = new Array()
lang['en-US'] = require('./js/lang/en-US.json')
lang['ja-JA'] = require('./js/lang/ja-JA.json')
lang['tl-PH'] = require('./js/lang/tl-PH.json')

app.use(bodyParser())
app.set('view engine', 'ejs')

// ROUTES
app.use('/css', express.static('css'))
app.use('/js', express.static('js'))
app.use('/img', express.static('img'))
app.use('/apx_docs', express.static('apx_upd/docs'))
app.use('/apx_certs', express.static('apx_upd/certs'))

app.use(session({
	secret: "digitalMeSecretString",
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 30 * 3 // 3 Months
	},
	store: new MongoStore({
		url: 'mongodb://localhost:27017/digitalme',
		secret: 'digialMeSecretString'
	})
}))

app.get('/applicant', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getActiveAnnouncements(req.session.lang)
		.then(result => {
			res.locals.activeAnnouncements = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
		else res.render('applicant_index')
})

app.get('/applicant/login', (req, res) => {
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.redirect('/applicant')
})

app.get('/applicant/register', (req, res) => {
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_register')
	else res.render('applicant_index')
})

app.get('/applicant/documents', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	res.locals.languageProcessor = languageProcessor
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getValidDocuments(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_documents = result
		})
		.catch(err => {})
	await applicants.countInvalidDocuments(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_invalidate_documents_ctr = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_documents')
})

app.post('/applicant/document-upload', applicant_docs_upload.single('file'), (req, res) => {
	app.use(fileUpload({
		useTempFiles: true,
		tempFileDir: '/tmp',
		createParentPath: true,
		safeFileNames: true,
		debug: true
	}))
	var applicant = req.session.auth_applicant
	var doctype = req.body.doctype
	var file = req.file
	var time = req.file.filename.split('-')[1]
	if (
		applicant != null ||
		doctype != null ||
		file != null
	) {
		applicants.saveDocument(applicant.walletAddress, time, doctype, file.filename)
			.then((res)=>{
				res.redirect("/applicant/documents")
			})
			.catch((err)=> {
				res.redirect("/applicant/documents")
			})
	} else {
		res.redirect("/applicant/documents")
	}
})

app.post('/applicant/experience-add', (req, res) => {
	var applicant = req.session.auth_applicant
	var company_name = req.body.company_name
	var position = req.body.position
	var start_date = req.body.start_date
	var end_date = req.body.end_date
	var country = req.body.country
	var monthly_salary = req.body.monthly_salary
	var description = req.body.description
	var time = Date.now()
	if (
		(company_name !== "" || company_name != null)  &&
		(position !== "" || position != null)  &&
		(start_date !== "" || start_date != null)  &&
		(end_date !== "" || end_date != null)  &&
		(country !== "" || country != null)  &&
		(monthly_salary !== "" || monthly_salary != null)
	) {
		applicants.addNewExperience(
			applicant.walletAddress,
			time,
			company_name,
			position,
			start_date,
			end_date,
			country,
			monthly_salary,
			description
		).then((res)=>{
			res.redirect('/applicant/experiences')
		})
		.catch((err)=> {
			res.redirect('/applicant/experiences')
		})
	} else {
		res.redirect('/applicant/experiences')
	}
})

app.get('/applicant/experiences', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getExperiences(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_experiences = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_experiences')
})

app.post('/applicant/certificate-upload', applicant_certs_upload.single('file'), (req, res) => {
	app.use(fileUpload({
		useTempFiles: true,
		tempFileDir: '/tmp',
		createParentPath: true,
		safeFileNames: true,
		debug: true
	}))
	var applicant = req.session.auth_applicant
	var certname = req.body.certname
	var file = req.file
	var time = req.file.filename.split('-')[1]
	if (
		applicant != null ||
		certname != null ||
		file != null
	) {
		applicants.saveCertificate(applicant.walletAddress, certname, file.filename)
			.then((res)=>{
				res.redirect("/applicant/certificates")
			})
			.catch((err)=> {
				res.redirect("/applicant/certificates")
			})
	} else {
		res.redirect("/applicant/certificates")
	}
})


app.get('/applicant/certificates', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getCertificates(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_certificates = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_certificates')
})

app.get('/applicant/skills', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getSkills(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_skills = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_skills')
})


app.post('/applicant/skill-add', (req, res) => {
	var applicant = req.session.auth_applicant
	var skill = req.body.skill
	if (
		(applicant !== "" || applicant != null)  &&
		(skill !== "" || skill != null)
	) {
		applicants.addSkill(
			applicant.walletAddress,
			skill
		).then((res)=>{
			res.redirect('/applicant/skills')
		})
			.catch((err)=> {
				res.redirect('/applicant/skills')
			})
	} else {
		res.redirect('/applicant/skills')
	}
})

app.get('/applicant/language-proficiencies', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	await applicants.getLanguageProficiencies(req.session.auth_applicant.walletAddress)
		.then(result => {
			res.locals.applicant_language_proficiencies = result
		})
		.catch(err => {})
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_language_proficiencies')
})

app.post('/applicant/language-proficiency-add', (req, res) => {
	var applicant = req.session.auth_applicant
	var language = req.body.language
	var level = req.body.level
	if (
		(applicant !== "" || applicant != null)  &&
		(language !== "" || language != null) &&
		(!Number.isNaN(level) && level != 0)
	) {
		applicants.addLanguageProficiency(
			applicant.walletAddress,
			language,
			level
		).then((res)=>{
			res.redirect('/applicant/language-proficiencies')
		})
			.catch((err)=> {
				res.redirect('/applicant/language-proficiencies')
			})
	} else {
		res.redirect('/applicant/language-proficiencies')
	}
})

app.get('/applicant/statistics', (req, res) => {
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_statistics')
})


app.get('/applicant/settings', (req, res) => {
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_applicant = req.session.auth_applicant
	if (req.session.auth_applicant === undefined || req.session.auth_applicant == "") res.render('applicant_login')
	else res.render('applicant_settings')
})

app.post('/applicant/settings/changeLanguage', (req, res) => {
	if (req.body.lang !== undefined || req.body.lang !== "") {
		req.session.lang = req.body.lang
	}
	res.redirect('/applicant')
})

app.post('/ajx/add-applicant', (req, res) => {
	var walletAddress = req.body.walletAddress
	var emailAddress = req.body.emailAddress
	var password = req.body.password
	var name = req.body.name
	var physicalAddress = req.body.physicalAddress
	var location = req.body.location
	var nationality = req.body.nationality
	var contact_number = req.body.contact_number
	var salaryFlooring = 0.00
	var salaryCeiling = 0.00
	if (
		true
	) {
		applicants.apply(walletAddress, emailAddress, password, contact_number, name, physicalAddress, nationality, location, salaryFlooring, salaryCeiling, true, 0)
			.then(result => {
				res.json({status: "ok", date: logger.genLongTime()})
			})
			.catch(error => {
				var statusMsg
				switch (error.code) {
					case 11000:
						statusMsg = "duplicate"
						break;

					default:
						statusMsg = "unknown"
						break;
				}
				res.json({status: statusMsg, problem: error, date: logger.genLongTime()})
			})
	} else {
		res.json({status: "incomplete", date: logger.genLongTime()})
	}
})

app.post('/ajx/check-applicant-duplicates', (req, res) => {
	var walletAddress = req.body.walletAddress
	var emailAddress = req.body.emailAddress
	if (
		(walletAddress != null && typeof walletAddress !== undefined) &&
		(emailAddress != null && typeof  emailAddress !== undefined)
	) {
		applicants.hasDuplicates(walletAddress, emailAddress)
			.then(result => {
				res.json({status: "ok", result: result.length!=0?"yes":"no", duplicates: result.length, date: logger.genLongTime()})
			})
			.catch(err => {
				res.json({status: "error", "date": logger.genLongTime()})
			})
	} else {
		res.json({status: "incomplete", "date": logger.genLongTime()})
	}
})

app.post('/ajx/login-applicant', (req, res) => {
	var emailAddress = req.body.emailAddress
	var password = req.body.password
	if (emailAddress != null && password != null) {
		applicants.login(emailAddress, password)
			.then(result => {
				if (result.token !== '' || typeof result.token !== 'undefined') {
					req.session.auth_applicant = result
					res.json({status: "ok"})
				} else {
					res.json({status: "not ok"})
				}
			})
			.catch(_ => {
				res.json({status: "not ok"})
			})
	} else {
		res.json({status: "not ok"})
	}
})

app.get('/applicant/logout', (req, res) => {
	req.session.auth_applicant = ""
	res.redirect('/applicant')
})

app.get('/employer', async (req, res) => {
	moment.locale(req.session.lang)
	res.locals.moment = moment
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.locals.auth_employer = req.session.auth_employer
	await applicants.getActiveAnnouncements(req.session.lang)
		.then(result => {
			res.locals.activeAnnouncements = result
		})
		.catch(err => {})
	res.render('employer_index')
})

app.get('/employer/login', (req, res) => {
	if (req.session.lang === undefined) req.session.lang = 'en-US'
	res.locals.lang = lang[req.session.lang]
	res.locals.languageProcessor = languageProcessor
	res.render('employer_login')
})

app.listen(port, () => console.log('DigitalMe now actively listening at port '+port))