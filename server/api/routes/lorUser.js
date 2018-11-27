const { resetCred,saveSignupUser,getDocCount, LorUser, validate, UserAction, Payment, validateCred, checkDuplicateEmail} 
= require('../model/userMod');
const config = require('config');
const internet = require('is-reachable');
const url = require('url');
const _ = require('lodash');
const bodyParser = require('body-parser');
const mail = require('./sendMail');
const fs = require('fs');
const express = require('express');
const router = express.Router();

let jsonParser = bodyParser.json();
let urlencodeParser = bodyParser.urlencoded({extended: false});

/*
* This method is used to update User data to the database (LorUsers) with additional data
* Parameter to be set: set the user data as json 
* Method call from GUI: /wsapi/customer/upd
*/
router.put('/upd', jsonParser, async (req, res) => 
{
    let updUser = _.pick(req.body, ['country', 'state', 'ownaproperty']);
    let query = req.body.email;
    let userExists = await LorUser.findOneAndUpdate(
        {email: query}, 
        {$set: updUser}, 
        {new: true, fields: {email:1, country: 1, state: 1, ownaproperty:1, _id:0}}, (err, upd) =>
    {
        if(err)
            res.status(400).send('Update of User Data - failed ! ' + err.details);
        else
            res.status(200).send(upd);
    });
});

/*
* This method is used to update User Property data to the database (LorUsers) with additional data
* Parameter to be set: set the user data as json 
* Method call from GUI: /wsapi/customer/updProp
*/
router.put('/updProp', jsonParser, async (req, res) => 
{
    let updProp = _.pick(req.body, 
        ['propertyDeveloper', 'propertyName', 'propertyType', 'area', 'measure','propertyNumber',
        'propertyCountry','propertyState','propertyDistrict', 'ratePerSq','dateBought']);
    let query = req.body.email;
    let userExists = await LorUser.findOneAndUpdate(
        {email: query}, 
        {$set: updProp}, 
        {new: true, fields: {propertyName:1, propertyType: 1, area: 1, measure:1, _id:0}}, (err, upd) =>
    {
        if(err)
            res.status(400).send('Update of User Property Data - failed ! ' + err.details);
        else
            res.status(200).send(upd);
    });
});

/*
* This method is used to update User Payment data to the database
* Parameter to be set: set the user data as json 
* Method call from GUI: /wsapi/customer/updPay
* Parameters: reportSubscribed: true, reportType {'Basic','Silver','Gold','Platinum'}, PaymentMade: true, email}
*/
router.put('/updPay', jsonParser, async (req, res) => 
{
    let updPay = _.pick(req.body, ['reportSubscribed', 'reportType', 'paymentMade']);
    let query = req.body.email;
    await LorUser.findOneAndUpdate(
        {email: query}, 
        {$set: updPay}, 
        {new: true, fields: {reportSubscribed:1, reportType: 1, _id:0}}, (err, upd) =>
    {
        if(err)
            res.status(400).send('Update of User Property Data - failed ! ' + err.details);
        else
        {
            let updUA = _.pick(req.body, ['reportSubscribed', 'reportType']);
            //update userActions collection on reportSubscribed=true;
            UserAction.findOneAndUpdate(
                {email: query}, 
                {$set: updUA}, 
                {new: true, fields: {reportSubscribed:1, reportType: 1, _id:0}}, (err, upd) =>
            {
                if(err)
                    res.status(400).send('Update of User Actions Data - failed ! ' + err.details);
            });

            //res.send(upd);
            //Calling user payment data block
            let insPayMas = _.pick(req.body, 
                ['email','reportSubscribed', 'reportType', 'paymentMode', 'paymentThrough', 'discounts','totalPaid']);

                insPayMas.payEndDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                //console.log('insPayMas Object: ', insPayMas);

            let insPayAction = new Payment(insPayMas);
            let insPromise = insPayAction.save(function (err)
            {
                if (err)
                    res.status(400).send(err);
                else
                    res.status(200).send(insPromise);
            });
        }
    });
});

/*
* This method is used to validate the email id of the customer
* Parameter to be set: set the query string from URL
* Method call from GUI: /wsapi/customer/emailAuth
*/
router.post('/emailAuth', jsonParser, async (req, res) => 
{
    let adr = req.body.fetchedUrl;    
    let q = url.parse(adr, true);
    let qdata = q.query;
    let updUser = {};
    updUser.emailValidated = true;

    await LorUser.findOneAndUpdate(
    {_id: qdata.cusId}, 
    {$set: updUser}, 
    {new: true, fields: {cusId:1, email:1, _id:0}}, async (err, upd) =>
    {
        if(err)
            res.status(400).send('Update of User Data - failed ! ' + err.details);
        else
        {
            //console.log('Updated Data - cusId: ',upd);
            await UserAction.findOneAndUpdate(
                {cusId: upd.cusId}, 
                {$set: updUser}, 
                {new: true, fields: {cusId:1, email:1, _id:0}}, (err, upd) =>
                {
                    if(err)
                        res.status(400).send('Update of User Data - failed ! ' + err.details);
                    else
                    {
                        //console.log('Updated Data - cusId: ',upd);
                        res.status(200).send(upd);
                    }                        
                });
            console.log('lorUser - emailAuth - Updated DB');
        }
    });
});

/*
* This method is used to validate the email id of the customer
* Parameter to be set: send email and pwd
* Method call from GUI: /wsapi/customer/vCred
*/
router.post('/vCred', jsonParser, async (req, res) => 
{
    let email = req.body.email;    
    let pwd = req.body.pwd;    
    let vObj={};
    vObj.email = email;
    vObj.pwd = pwd;
    let vResult = validateCred(vObj)
    .then(resl => res.status(200).send(resl))
    .catch(err => res.status(400).send(err));
    //console.log('lorUser - Validate Credential - Result: ', res);
});

/*
* This method is used to reset the email id of the customer
* Parameter to be set: set emailid of the user
* Method call from GUI: /wsapi/customer/rstCred
*/
router.post('/rstCred', jsonParser, async (req, res) => 
{
    let email = req.body.email;    
    let vObj={};
    vObj.email = email;    
    let rcResult = resetCred(vObj)
    .then(result => 
    {
        result[0].pwd='';
        //console.log('lorUser - result check:', result);
        res.status(200).send(result);
        //send email if usrExists...
        if (result != null && result.length > 0)
        {
            let chtml = config.get('templates.userpwdReset');
            let coverhtml = fs.readFileSync(chtml, 'utf8');            
            let mObj={};
            mObj.to=result[0].email;
            mObj.subject='LOR read me';
            mObj.cusName= result[0].firstName+" "+result[0].lastName;
            coverhtml = coverhtml.replace(/#cusName/i, mObj.cusName);
            coverhtml = coverhtml.replace(/#lCred/i, 'Welcome@123');            
            mObj.mailOccasion='custom';
            mObj.htmlContent = coverhtml;
            mObj.attachment=false;
            mObj.customerId=result[0].cusId;
            mObj.url='';
            mail(mObj, false, mObj);            
        }
    })
    .catch(err => {res.status(400).send(err);});
    console.log('lorUser - Reset Credentials - Completed ');
});

/*
* This method is used to insert User data to the database - LorUsers
* Parameter to be set: set the user data as json 
* Method call from GUI: /wsapi/customer
*/
router.post('/', jsonParser, async (req, res) => 
{
    let counter = 0;
    //console.log('Post hits router... '); 
    let userObj = _.pick(req.body, ['firstName', 'lastName', 'email', 'phone', 'state', 'country']);
    
    //Additional parameter is being set
    userObj.mailFrequency = config.get('templates.emailFrequency');

    const {error} = validate(userObj);
    if (error) 
    {
        console.log('Data Validation Error : ', error.details);
        return res.status(400).send (error.details[0].message);
    }
    else
    {
        let cde = await checkDuplicateEmail(userObj)
        .then(resol => 
        {
            res.status(200).send(userObj);
            console.log('lorUser - checkDuplicateEmail - Result: ', resol);
            let cusCount = getDocCount()
            .then(cnt => 
            {
                console.log('getCount cnt data: ', cnt);
                let dbFlag = true;                    
                let userId;
                let count = cnt;
                userObj.cusId = count + 1;
                console.log('getCount count + 1 data: ', userObj.cusId);
                let saveData = saveSignupUser(userObj)
                .then(function (rObj)
                {
                    if (rObj != null)
                    {                            
                        //console.log('lorUser - saveSignupUser - finally - rObj: ', rObj);
                        userId = rObj.id;
                        console.log('lorUser - after saving data to lorusers collection: ', userId);
                        //Sending status to GUI - below has a delay, hence commenting
                        //res.status(200).send(retObj);
                        let domainName = config.get('domainName');
                        let port = process.env.PORT;
                        let welcomeStr = config.get('templates.welcomeUrl');                    
                        let httpprotocal = config.get('http');
                        let httpsprotocal = config.get('https');
                        let environ = config.get('environ');
                        let protocal;
                        let welcomeURL;
                        if (environ == 'local') 
                        {
                            protocal = httpprotocal;
                            welcomeURL = protocal + domainName + ':' + port + welcomeStr + userId;
                        }
                        else 
                        {
                            protocal = httpsprotocal;
                            welcomeURL = protocal + domainName + welcomeStr + userId;
                        }
                        console.log('lorUser - Welcome URL: ', welcomeURL);
    
                        //Construct mail object
                        let mSub = config.get('mail.subject');
                        mSub = mSub + ' - User Creation';
                        let mailObj = 
                        {
                            from: config.get('mail.user'),
                            to: userObj.email,
                            subject: mSub,
                            cusName: userObj.firstName + " " + userObj.lastName,
                            mailOccasion: 'usercreation',
                            mailType: config.get('mail.htmlMail'),
                            attachment: false,
                            customerId: userObj.cusId,
                            url: welcomeURL
                        };
                        //This is being set to add it as part of useractions table
                        userObj.mailOccasion = 'usercreation';
                        console.log('lorUser - Email Obj - First time user creation: ', mailObj);
                        //check if internet is available to send emails
                        internet('google.com')
                        .then(reachable =>
                        {
                            //Send email to the user
                            if(reachable)                        
                                mail(mailObj, dbFlag, userObj);
                            else
                                console.log('lorUser - No Internet - Mail not Sent');
                        })
                        .catch(err => 
                        {
                            console.log('lorUser - Unable to send email : ', err.details);
                        });                        
                    }                    
                })
                .catch(err => console.log('lorUser - saveSignupUser() - error: ', err));                    
            })
            .catch(err => console.log('lorUser - getDocCount() - error: ', err));                
        })
        .catch(err => res.status(400).send(err));
    }     
});


module.exports = router;