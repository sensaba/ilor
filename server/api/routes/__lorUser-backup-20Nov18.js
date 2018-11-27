const { LorUser, validate, UserAction, Payment, validateCred} = require('../model/userMod');
const config = require('config');
const internet = require('is-reachable');
const url = require('url');
const _ = require('lodash');
const bodyParser = require('body-parser');
const mail = require('./sendMail');
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
            //res.status(200).send(upd);
        }            
    });
});

/*
* This method is used to validate the email id of the customer
* Parameter to be set: set the query string from URL
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
* This method is used to insert User data to the database - LorUsers
* Parameter to be set: set the user data as json 
* Method call from GUI: /wsapi/customer
*/
router.post('/', jsonParser, async (req, res) => 
{
    let counter = 0;
    console.log('Post hits router... '); 
    let userObj = _.pick(req.body, ['firstName', 'lastName', 'email', 'phone', 'state', 'country']);
    
    //Additional parameter is being set
    userObj.mailFrequency = config.get('templates.emailFrequency');
    //console.debug('Printing user object: ', userObj);    

    /*
    let userObj = 
    {       
        firstName: req.body.firstName, 
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        state: req.body.state,
        country: req.body.country        
    };
    */

    const {error} = validate(userObj);
    if (error) 
    {
        console.log('Data Validation Error : ', error.details);        
        return res.status(400).send (error.details[0].message);
    }
    else
    {
        let userCreated = await LorUser.findOne({email: userObj.email, activeFlag: true});
        if (userCreated) 
        {
            console.log("User already registered");
            return res.status(400).send('User already registered.');
        }
        
        /*
        //Below code can be simplified using lodash _.pick method
        let lorUserDetail = new LorUser(
        {
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            email: userObj.email,
            phone: userObj.phone,
            state: userObj.state,
            country: userObj.country
        });
        */
        
        return new Promise (function(resolve, reject)
        {
            let lorUserDetail = new LorUser(
                _.pick(userObj, ['firstName', 'lastName', 'email', 'phone', 'state', 'country', 'referringCompany']));
     
            LorUser.estimatedDocumentCount(
            function(err, cnt) 
            {
                if (err)
                {
                    reject(res.status(400).send(err.details));
                }
                else
                {
                    let dbFlag = false;
                    let dbO = {};
                    let userId;
                    counter = cnt;
                    lorUserDetail.cusId = counter + 1; //increasing the customer id
                    //Saving data to lorUsers collection
                    userCreated = lorUserDetail.save(function(err, user)
                    {
                        userId = user.id;
                        console.log('lorUser - after saving data to lorusers collection: ', userId);
                        //Start
                        let domainName = config.get('domainName');
                        let port = process.env.PORT;
                        let welcomeStr = config.get('templates.welcomeUrl');                    
                        let welcomeURL = 'http://'+domainName+':'+port+welcomeStr+userId;
                        console.log('lorUser - Welcome URL: ', welcomeURL);
    
                        //Construct mail object
                        let mSub = config.get('mail.subject');
                        mSub = mSub + ' - User Creation';
                        let mailObj = 
                        {
                            from: config.get('mail.user'),
                            to: userObj.email,
                            subject: mSub,
                            cusName: lorUserDetail.firstName + " " + lorUserDetail.lastName,
                            mailOccasion: 'usercreation',
                            mailType: config.get('mail.htmlMail'),
                            attachment: false,
                            customerId: lorUserDetail.cusId,
                            url: welcomeURL
                        };
                        //check if internet is available to send emails and write to User Actions table.
                        internet('google.com')
                        .then(reachable =>
                        {
                            //Send email to the user
                            if(reachable)                        
                                mail(mailObj, dbFlag, dbO);
                            else
                                console.log('lorUser - No Internet - Mail not Sent');
    
                            //insert details into Useraction collection / table
                            let userActionDetail = new UserAction(
                                _.pick(lorUserDetail, ['cusId', 'referringCompany', 'email', 'reportType','reportSubscribed'])
                            );        
                            userActionDetail.mailOccasion = mailObj.mailOccasion;
    
                            let usrActionsCreated = userActionDetail.save();
                            console.log('User actions saved to database successfully !');
                        })
                        .catch(err => 
                        {
                            console.log('Unable to send email : ', err.details);
                        });
    
                        //End
                    });
                    console.log('User data saved to database successfully !');    
                    resolve(res.status(200).send(lorUserDetail));                    
                }
            });
        });
    } 
    //return res.status(200).send(lorUserDetail);
});


module.exports = router;