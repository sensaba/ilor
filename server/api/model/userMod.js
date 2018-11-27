const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
const Joi = require('joi');
const config = require('config');
const _ = require('lodash');

/*
* This collection (table in sql) is to hold all the customer details
* The customer can be directly registered from Website or can be entered by referring company
* Referring company can use spread sheet, upload it to FTP or server location 
* They can enter customer details using the website with a customized login
*/
const lorUserSchema = new mongoose.Schema(
{
    cusId: Number,
    referringCompany: {type: String, default: 'Web-direct'}, //Web-direct is for the users who register using lor website.
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true}, //when unique is provided, duplicate emails cannot be stored
    pwd: {type: String, default: 'Welcome@123'},
    phone: {type: String},
    country: String,
    state: String,
    ownaproperty: Boolean,
    propertyDeveloper: String,
    propertyName: String,
    propertyType: String,
    area: Number,
    measure: {type: String, default: 'Sqft'},    
    propertyNumber: String,
    propertyCountry: String,
    propertyState: String,
    propertyDistrict: String,
    ratePerSq: String,
    dateBought: Date,
    reportSubscribed: Boolean,
    emailValidated: {type: Boolean, default: false},
    reportType: {type: String, default: 'Basic'},
    mailFrequency: {type: Number, default: 15},
    paymentMade: {type: Number, default: 0},
    userSince: {type: Date, default: Date.now },
    lastLogin: {type: Date, default: Date.now }, 
    activeFlag: {type: Boolean, default: true}
});
    
//LorUser is a class returned by monoose.model
const LorUser = mongoose.model('LorUser', lorUserSchema);

/*
* This function is used to validate the data provided from calling program
* This function makes use of Joi package
*/
function validateUserParams(userObj)
{    
    const userSchema = 
    {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().regex(/[0-9]{10}/),
        pwd: Joi.string(),
        state: Joi.any().optional(),
        country: Joi.any().optional(),
        mailFrequency: Joi.string()
    };
    return Joi.validate(userObj, userSchema);
}

/*
* This function is used to validate the data provided from calling program
* This function makes use of Joi package
* This function is exclusively used for the data which is fed using XLS (customer data)
*/
function validateCusParams(userObj)
{    
    const cusSchema = 
    {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.any(),        
        state: Joi.any().optional(),
        country: Joi.any().optional(),
        ownaproperty: Joi.boolean().truthy('yes', 'Yes', 1, '1').falsy('no', 'No', 0, '0'),
        propertyDeveloper: Joi.string(),
        propertyName: Joi.string(),
        propertyType: Joi.string(),
        area: Joi.number(),
        measure: Joi.string(),
        propertyNumber: Joi.any(),
        propertyCountry: Joi.string(),
        propertyState: Joi.string(),
        propertyDistrict: Joi.string(),
        ratePerSq: Joi.any(),
        dateBought: Joi.date(),
        reportSubscribed: Joi.boolean().truthy('yes', 'Yes', 1, '1').falsy('no', 'No', 0, '0'),
        reportType: Joi.any(),
        paymentMade: Joi.any(),
        referringCompany: Joi.string()
    };
    return Joi.validate(userObj, cusSchema);
}

/* -------------------------------------End of lor User capture details------------------------------------- */

/* --------------------------------------Start of User Action capture--------------------------------------- */

/*
* This collection (table in sql) is to hold all the customer action details
* The customer actions like email sent, type of email sent, etc are stored
* On periodic basis, mails will be sent to customer on reminders, reports, etc 
*/
const userActionSchema = new mongoose.Schema(
{
    cusId: Number,
    referringCompany: {type: String, default: 'Web-direct'}, //Web-direct is for the users who register using lor website.
    email: {type: String, required: true}, //removed unique
    reportSubscribed: Boolean,
    reportType: String,
    mailOccasion: {type: String},
    emailValidated: {type: Boolean, default: false},
    mailSentDate: {type: Date, default: Date.now },
    activeFlag: {type: Boolean, default: true}
});
        
//UserAction is a class returned by monoose.model
const UserAction = mongoose.model('UserAction', userActionSchema);

/* ---------------------------------------End of User Action capture---------------------------------------- */

/* --------------------------------------Start of User Payment capture-------------------------------------- */

/*
* This collection (table in sql) is to hold all the customer Payment details
*/
let SchemaTypes = mongoose.Schema.Types;
const userPaymentSchema = new mongoose.Schema(
{
    cusId: Number,
    referringCompany: {type: String, default: 'Web-direct'}, //Web-direct is for the users who register using lor website.
    email: {type: String, required: true}, //when unique is provided, duplicate emails cannot be stored
    reportSubscribed: Boolean,
    reportType: String,
    paymentMode: {type: String, default: 'Net Banking'},
    paymentThrough: {type: String},
    payStartDate: {type: Date, default: Date.now },
    payEndDate: {type: Date},
    discounts: {type: SchemaTypes.Double, default: 0.0},
    cgstPercent: {type: SchemaTypes.Double, default: 6.0},
    sgstPercent: {type: SchemaTypes.Double, default: 6.0},
    cgst: {type: SchemaTypes.Double, default: 0.0},
    sgst: {type: SchemaTypes.Double, default: 0.0},
    totalPaid: {type: SchemaTypes.Double},
    arrears: {type: SchemaTypes.Double},
    activeFlag: {type: Boolean, default: true}
});

const UserPayment = mongoose.model('UserPayment', userPaymentSchema);
    
/* ---------------------------------------End of User Payment capture--------------------------------------- */

/*
* This method is used to get the City and Country details from LorUsers Table / collection
* Using the City and Country, the weather data will be retreived and stored into db
*/
async function getCityCountry()
{
    let resCountry={};    
    let cityCountryData = await LorUser.aggregate([
    {
        $match:  {reportSubscribed: true, activeFlag: true, propertyDistrict: {"$exists": true, "$ne": null}}
    },
    {
        $group: {_id: {propertyDistrict: "$propertyDistrict", propertyCountry: "$propertyCountry"}}
    }], function(err, messages)
    {            
        if(err)
            console.log('Error : ', err);
        else            
            resCountry = messages;

        //console.log('getCityCountry - Get country and city for Weather: ', resCountry);
        /*
        for (i=0; i<resCountry.length; i++)
        {
            console.log('inside loop');
            console.log('City : ', resCountry[i]._id.propertyDistrict);
            console.log('Country : ', resCountry[i]._id.propertyCountry);
        }
        */           
    });   
    return new Promise((resolve, reject) =>
    {
            if (resCountry != null)
                resolve(resCountry);
            else
                reject('Error................................');
    });
}

//This method will get all report subscribers irrespective of plan.
//Group them based on the reportType to send various reports.
async function getUsersForSendingReport()
{
    /* //Commented on 14Nov18 as the query has been changed to fix a bug in this approach...
    let rejData = {};
    let curDate = new Date();
    let cusData = await UserAction
    .find({reportSubscribed: true, activeFlag: true})
    .and({mailOccasion: {$nin: 'repsubscribe'}, 
    mailSentDate: {$nin: curDate.getDate() - config.get('templates.detailedReportFrequency')}})
    .select({cusId: 1, email: 1, reportType: 1, referringCompany: 1, reportSubscribed:1, _id:0});
    
    //console.log('getUsersForSendingReport - Missing Reports in User Actions: ', cusData);    
    */
    let rejData = {};
    let curDate = new Date();
    let fromDate = new Date().setDate(new Date().getDate() 
    - config.get('templates.detailedReportFrequency'));

    let cusData = await UserAction
    .find({emailValidated: true, reportSubscribed: true, activeFlag: true, mailOccasion: 'usercreation'}) 
    //.and({mailOccasion: {$nin: 'repsubscribe'}})
    .select({cusId: 1, email: 1, reportType: 1, referringCompany: 1, 
       reportSubscribed:1, mailOccasion: 1, mailSentDate:1,  _id:0});

    //console.log('getUsersForSendingReport - Reports already in User Actions: ', cusData);

    let cusArray=[];
    for (i in cusData)
    {
       cusArray.push(cusData[i].cusId);
    }
    //console.log('cusArray Data: ', cusArray);

    if (cusArray.length > 0)
    {        
        let cusWhoNeedsReports = await UserAction
        .find({emailValidated: true, reportSubscribed: true, activeFlag: true, mailOccasion: 'repsubscribe'})
        .and({cusId: {$in: cusArray}, 
            mailSentDate: {$gte: (new Date(fromDate)), $lte: new Date()}})
        .select({cusId: 1, email: 1, reportType: 1, referringCompany: 1, 
            reportSubscribed:1, mailOccasion: 1, mailSentDate:1,  _id:0});
        
        let repSub=[];
        let finreport=[];
        for (j in cusWhoNeedsReports)
        {
            repSub.push(cusWhoNeedsReports[j].cusId);            
        }
        //console.log('cusWhoNeedsReports Data: ', repSub);
        //console.log('cusArray Data: ', cusArray);

        if (repSub.length > 0)
            finreport = cusArray.filter(val => !repSub.includes(val));
        else
        finreport = cusArray;

        console.log('Customers to whom the Report Email will be sent: ', finreport);

        if (finreport.length > 0)
        {
            let reports = await UserAction
            .find({emailValidated: true, reportSubscribed: true, activeFlag: true})
            .and({cusId: {$in: finreport}})
            .select({cusId: 1, email: 1, reportType: 1, referringCompany: 1, 
                reportSubscribed:1, mailOccasion: 1, mailSentDate:1,  _id:0});
    
            //console.log('getUsersForSendingReport - Report needs to be sent to: ', reports); 
            
            return new Promise((resolve, reject) =>
            {
                if (reports != null)
                    resolve(reports);
                else
                    reject(rejData);
            });        
        }
    }
}

//Gets all the users based on email id.
async function getUsersByEmail(eObj)
{    
    let rejData = {};    
    let cusData = await LorUser
    //.find({reportSubscribed: true, activeFlag: true, ownaproperty: true,  email: {$in: eObj}})
    .find({reportSubscribed: true, activeFlag: true, ownaproperty: true,  email: eObj})
    .select({cusId: 1, email: 1, reportType: 1, firstName:1, lastName: 1, propertyDeveloper: 1, 
        propertyName: 1, propertyNumber: 1, propertyCountry: 1, propertyState: 1, propertyDistrict: 1, 
        ratePerSq: 1, area: 1, dateBought: 1, reportSubscribed:1, emailValidated:1, _id:0});
        
    console.log('getUsersForSendingReport - Missing Reports in User Actions: ', cusData);    

    return new Promise((resolve, reject) =>
    {
        if (cusData != null)
            resolve(cusData);
        else
            reject(rejData);
    });
}

//Login validation.
async function validateCred(credObj)
{    
    let rejData = {};    
    let userExists = await LorUser 
    .find({activeFlag: true, email: credObj.email})
    .select({cusId: 1, email: 1, _id:0});
    //console.log('userMod - userExists - Result: ', userExists);
    
    if (userExists != null && userExists.length > 0)
    {        
        let cusData = await LorUser    
        .find({activeFlag: true, email: credObj.email, pwd: credObj.pwd})
        .select({cusId: 1, email: 1, reportType: 1, firstName:1, lastName: 1, propertyDeveloper: 1, 
            propertyName: 1, propertyNumber: 1, propertyCountry: 1, propertyState: 1, propertyDistrict: 1, 
            ratePerSq: 1, area: 1, dateBought: 1, reportSubscribed:1,emailValidated:1,   
            emailValidated:1, _id:0});
        //console.log('userMod - cusData: ', cusData );

        return new Promise((resolve, reject) =>
        {
            if (cusData != null && cusData.length > 0)
                resolve(cusData);
            else
                reject('User Name or Password does not match');
        });
    }
    else
    {
        return new Promise((resolve, reject) =>
        {
            reject('User does not exist, please sign up');
        });
    }            
}

/*
* This method is used to Reset Password
* This method will check if the user exists based on the email / user name provided
* if the user name is available in db, it will retreive the default pwd and send.
*/
async function resetCred(cObj)
{
    let usrExists = await LorUser 
    .find({activeFlag: true, email: cObj.email})
    .select({cusId: 1, firstName: 1, lastName: 1, email: 1, pwd:1, _id:0});
    return new Promise((resolve, reject) =>
    {
        if (usrExists != null && usrExists.length > 0)
            resolve(usrExists);
        else
            reject('User does not exist. Please use Signup option.');
    });
}
//This method is used to check if the email id is already existing in the db
async function checkDuplicateEmail(emailObj)
{
    let rejFlag=false;
    let userCreated = await LorUser
    .findOne({email: emailObj.email, activeFlag: true}, (error, val) =>
    {
        if (error)
            throw error;
        else if (val != null)
            rejFlag = true;
    });
    return new Promise((resolve, reject) =>
    {
        if (rejFlag)
            reject('User already exists!');
        else
            resolve('Go ahead and create the user');
    });
}

//This method is used to get the number of records in the loruser collection
async function getDocCount()
{
    let docCount=0;
    let failStatus=false;
    await LorUser.estimatedDocumentCount((err, cnt) => 
    {
        if (err)
            throw err;
        else
            docCount = cnt;
    });
    return new Promise((resolve, reject) =>
    {        
        resolve(docCount);
    });
}

//This method is used to get the number of records in the loruser collection
function saveSignupUser(userObj)
{    
    let objAfterSave={};
    return new Promise(function (resolve, reject)
    {
        let userDetail = new LorUser(
            _.pick(userObj, ['cusId', 'firstName', 'lastName', 'email', 'phone', 
            'state', 'country', 'referringCompany']));
    
        let saveUser = userDetail.save((err, usr) =>
        {
            if (err)
                reject(err);
            else
            {
                objAfterSave = usr;
                resolve(objAfterSave);
            }   
        });
    });            
}

exports.resetCred=resetCred;
exports.saveSignupUser = saveSignupUser;
exports.getDocCount=getDocCount;
exports.checkDuplicateEmail = checkDuplicateEmail;
exports.validateCred = validateCred;
exports.customerDataForReports = getUsersForSendingReport;
exports.getCityCountry = getCityCountry;
exports.getUsersByEmail = getUsersByEmail;
exports.LorUser = LorUser;
exports.validate = validateUserParams;
exports.validateCusParams = validateCusParams;
exports.UserAction = UserAction;
exports.Payment = UserPayment;