const nodemailer = require('nodemailer');
const conf = require('config');
const Joi = require('joi');
const file = require('fs');
const {UserAction} = require('../model/userMod');
const _ = require('lodash');

//Picking data from config file
let serName = conf.get('mail.service');
let uName = conf.get('mail.user');
let mailSub = conf.get('mail.subject');

const transporter = nodemailer.createTransport(
{
    service: serName,
    auth: 
    {
        //user: 'landoptimizer18@gmail.com',
        user: uName,
        pass: '1st@rpr0p0ptrep'
    }
});

/* This function is used to set the values after verifying the data from the calling program */
function sendEmail(mailContents, dbFlag, dbObj)
{
    let stat = false;
    const schema = 
    {
        from: Joi.string().email().optional(),
        to: Joi.string().email().required(),
        subject: Joi.string().required(),
        cusName: Joi.string().required(),
        mailOccasion: Joi.string()
        .valid(['usercreation', 'repsubscribe', 'payment','custom']).required().default('custom'),
        mailType: Joi.string().default('html'),
        htmlContent: Joi.any().when('mailOccasion', {is: Joi.valid('custom'),
        then: Joi.string().required(),
        otherwise: Joi.any().optional()}),
        attachment: Joi.boolean().required(),
        fileName: Joi.any().when('attachment', {is: Joi.valid(true), then: Joi.any().required()}),
        path: Joi.any().when('attachment', {is: Joi.valid(true), then: Joi.any().required()}),
        contentType: Joi.any().when('attachment', {is: Joi.valid(true), then: Joi.any().required()}),
        customerId: Joi.any().optional(),
        url: Joi.any().optional()
    };

    //console.log(mailContents);
    Joi.validate(mailContents, schema, (err, value) => 
    {
        if (err)
        {
            console.log('Invalid Email parameter inputs...', err);
            stat = false;            
        }
        else
        {
            let finMail = setEmailContent(mailContents);
            if (finMail != null)
            {
                transporter.sendMail(finMail, function(error, info)
                {
                    if (error)
                    {                        
                        stat = false;
                        console.log(error);
                    }                        
                    else
                    {
                        stat = true;
                        console.log(`Email to ${mailContents.to} - Sent status: ` + info.response);
                        //if dbFlag is set to true, dbobj has to be passed to store into db from this class
                        if (dbFlag)
                        {                            
                            //insert details into Useraction collection / table
                            let userActionIns = new UserAction(
                                _.pick(dbObj, ['cusId', 'email', 'reportType',
                                'reportSubscribed', 'mailOccasion','emailValidated'])
                            );                            
                            let usrActions = userActionIns.save();                            
                            console.log('html2pdf - User actions saved to database successfully !');
                        }
                        else
                        {
                            console.log('html2pdf - db update not flagged');
                        }
                    }
                    //done();
                });
            }
        }
    });
}

/* function to set the email contents as per mail occassion */
function setEmailContent(maildata)
{
    /*
    Check with Joi if all the mandatory data is available
    Choose the appropriate template based on mailOccassion
    default email type is html
    load the html template based on the occasion and replace the required name, etc...
    */   
   let mailDetails;
   switch (maildata.mailOccasion)
   {
        case 'usercreation':
            console.log('Mail Occasion : ' + maildata.mailOccasion);
            let htmlStr = file.readFileSync(conf.get('templates.userCreation'), 'utf-8');
            //console.log('sendMail - htmlStr: ', htmlStr);
            let replacedStr = htmlStr.replace(/#cusName/i, maildata.cusName);
            replacedStr = replacedStr.replace(/#userName/i, maildata.to);
            replacedStr = replacedStr.replace(/#welcomeUrl/i, maildata.url);
            mailDetails = 
            {
               from: uName,
               to: maildata.to,
               subject: mailSub,
               html: replacedStr
            } 
            //console.log('sendMail - mailDetails: ', mailDetails);
            //attachments: [{filename: 'nandhi.png', path: conf.get('templates.userCrePic'), cid: 'nandhi@lor' }]
            return mailDetails; 
        case 'repsubscribe':
            console.log('Mail Occasion : ' + maildata.mailOccasion);
            mailDetails = 
            {
                from: uName,
                to: maildata.to,
                subject: mailSub,
                html: maildata.htmlContent,
                attachments: 
                [{filename: maildata.fileName, path: maildata.path, contentType: maildata.contentType }]
                //[{filename: 'rep.pdf', path: '../convertedPdf/test3.pdf', contentType: 'application/pdf' }]
            }
            return mailDetails;
        case 'custom':
            console.log('Mail Occasion : ' + maildata.mailOccasion);
            mailDetails = 
            {
                from: uName,
                to: maildata.to,
                subject: maildata.subject,
                html: maildata.htmlContent
            }
            return mailDetails;
        case 'default':            
            console.log('Mail Occasion : ' + maildata.mailOccasion);
            return mailDetails;
   }
}

//exporting or making the method sendEmail public so that it can be used from other js.
module.exports = sendEmail;