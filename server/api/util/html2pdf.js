//process.env.NODE_CONFIG_DIR='../../../config/'
const fs = require('fs');
const pdf = require('html-pdf');
const configParams = require('config');
const mail = require('../routes/sendMail');
const internet = require('is-reachable');

function convertToPdf(conObj, passedObj)
{
    let d = Date.now();
    let fName = conObj.rType+'_'+conObj.cId +"_"+d +'.pdf';
    let path = configParams.get('templates.generatedPDFLoc'); //'./config/generatedPdf/';
    let chtml = configParams.get('templates.coverhtml');
    let coverhtml = fs.readFileSync(chtml, 'utf8');
    coverhtml = coverhtml.replace(/#cusName/i, conObj.cusName);
    pdf.create(conObj.replacedStr, conObj.options).toFile(path + fName, function(err, res) 
    {
        if (err) 
            return console.log(err);
        else
        {
            let dbFlag = true;
            let dbObj = {};
            console.log('html2pdf ------- Email data being set.......');
            let mSub = configParams.get('mail.subject');
            mSub = mSub  + ' - Reports';
            //console.log('html2pdf - convertToPDF() - Email Subject: ', mSub);
            let mailObj = 
            {
                from: configParams.get('mail.user'),
                to: conObj.email,
                subject: mSub,
                cusName: 'not used in this context',
                mailOccasion: 'repsubscribe',
                mailType: configParams.get('mail.htmlMail'),
                htmlContent: coverhtml,                
                attachment: true,
                fileName: fName,
                path: path+fName,
                contentType: 'application/pdf',
                customerId: 0,
                url: conObj.url             
            };

            //construct the mail object and call the mail method
            //for updating the useractions collection pass the object
            dbObj.cusId = passedObj.customerDetails[0].cusId;            
            dbObj.email = passedObj.customerDetails[0].email;
            dbObj.reportSubscribed = passedObj.customerDetails[0].reportSubscribed;
            dbObj.emailValidated = passedObj.customerDetails[0].emailValidated;
            dbObj.reportType = passedObj.customerDetails[0].reportType;
            dbObj.mailOccasion = 'repsubscribe';
            //check if internet is available to send emails and write to User Actions table.
            
            internet('google.com')
            .then(reachable =>
            {
                //Send email to the user
                if(reachable)                        
                    mail(mailObj, dbFlag, dbObj);
                else
                    console.log('html2pdf - No Internet - Mail not Sent');
            });
        }
    });
}

/*
* This method will prepare the html based on the inputs on the sections like Weather, Soil, etc.
* Provide template details like weather, soil, etc.
* Plug in the details to the html template like individual weather data, etc.
*/
function prepareHtmlContents(contentObj)
{    
    let rType = contentObj.customerDetails[0].reportType;
    let cId = contentObj.customerDetails[0].cusId;

    let reportTemplate = configParams.get('templates.repMTemplate');
    let repPropTemplate = configParams.get('templates.repPropTemplate');
    let repWeaTemplate = configParams.get('templates.repWeaTemplate');
    let repSoilTemplate = configParams.get('templates.repSoilTemplate');    
    let repVastuTemplate = configParams.get('templates.repVastuTemplate');
    let repVastuTemplate1 = configParams.get('templates.repVastuTemplate1');
    let repUpcomingTemplate = configParams.get('templates.repUpcomingTemplate');
    let repOndemandTemplate = configParams.get('templates.repOndemandTemplate');    

    let mainhtml = fs.readFileSync(reportTemplate, 'utf8');    
    let prophtml = fs.readFileSync(repPropTemplate, 'utf8');    
    let soilhtml = fs.readFileSync(repSoilTemplate, 'utf8');
    let weatherhtml = fs.readFileSync(repWeaTemplate, 'utf8');    
    let vastuhtml = fs.readFileSync(repVastuTemplate, 'utf8');
    let vastuhtml1 = fs.readFileSync(repVastuTemplate1, 'utf8');
    let upcominghtml = fs.readFileSync(repUpcomingTemplate, 'utf8');
    let ondemandhtml = fs.readFileSync(repOndemandTemplate, 'utf8');

    //Templates are loaded as per ReportType = {Basic, Silver, Gold, Platinum}
    let replacedStr = mainhtml.replace(/#propertySection/i, prophtml);
    replacedStr = replacedStr.replace(/#soilSection/i, soilhtml);
    replacedStr = replaceProp(contentObj, replacedStr);
    replacedStr = replacedStr.replace(/#ondemandSection/i, ondemandhtml);
    //Uncomment this code when adding these sections........ START.....
    replacedStr = replacedStr.replace(/#neighbourhoodSection/i, "");
    replacedStr = replacedStr.replace(/#neighbourhoodDevelopmentSection/i, "");
    replacedStr = replacedStr.replace(/#economicsSection/i, "");
    //Uncomment this code when adding these sections........ END.....

    if (contentObj.upcomingPropertyDetails.length > 0)
    {
        replacedStr = replacedStr.replace(/#upcomingSection/i, upcominghtml);
        replacedStr = replaceUpcomingProp(contentObj, replacedStr);    
    }
    else
        replacedStr = replacedStr.replace(/#upcomingSection/i, "");

    switch (rType)
    {
        case 'Basic':
            replacedStr = replacedStr.replace(/#weatherSection/i, "");
            replacedStr = replacedStr.replace(/#vastuSection/i, "");
            replacedStr = replacedStr.replace(/#vastuSection1/i, "");
            break;
        case 'Silver':
            replacedStr = replacedStr.replace(/#weatherSection/i, weatherhtml);
            replacedStr = replaceWeather(contentObj, replacedStr);
            replacedStr = replacedStr.replace(/#vastuSection/i, vastuhtml);
            replacedStr = replacedStr.replace(/#vastuSection1/i, vastuhtml1);
            //Add vastu
            break;
        case 'Gold':
            replacedStr = replacedStr.replace(/#weatherSection/i, weatherhtml);
            replacedStr = replaceWeather(contentObj, replacedStr);
            replacedStr = replacedStr.replace(/#vastuSection/i, vastuhtml);
            replacedStr = replacedStr.replace(/#vastuSection1/i, vastuhtml1);
            //add sociology, cultural geography
            break;
        case 'Platinum':
            replacedStr = replacedStr.replace(/#weatherSection/i, weatherhtml);
            replacedStr = replaceWeather(contentObj, replacedStr);
            replacedStr = replacedStr.replace(/#vastuSection/i, vastuhtml);
            replacedStr = replacedStr.replace(/#vastuSection1/i, vastuhtml1); 
            //add vastu, sociology, cultural geography, Economics
            break;
    }
    let burl = configParams.get('templates.base');
    let fmt = configParams.get('templates.format');
    let options = 
    { 
        format: fmt,        
        base: burl,
        orientation: 'portrait',        
        paginationOffset: 1,        
        /*
        border: 
        {
            top: '2in',            // default is 0, units: mm, cm, in, px
            right: '1in',
            bottom: '2in',
            left: '1.5in'
        },
        
        header: 
        {
            height: '15mm',
            contents : '<hr>'
            //"contents": '<div style="text-align: center;">Author: Land Optimizer</div>'
        },
        */
        footer: 
        {
            height: '10mm',
            contents: 
            {
                //first: 'Page 1',
                //2: 'Page 2', // Any page number is working. 1-based index
                //default: '<hr><div style="text-align: center; font-size: 11px; "><span style="color: #808080;">Page &nbsp;{{page}} of &nbsp;</span><span style="color: #808080; font-size: 11px;">{{pages}}</span></div>'
                default: '<div style="text-align: center; font-size: 12px; font: Arial; color: #808080;">' 
                + 'Powered by: SCI® &nbsp;| &nbsp;  Page &nbsp;{{page}} of &nbsp;{{pages}}</div>'
                //last: 'Last Page'
            }
        }
    };
    //Since conventional way does not embed the images, we follow below methodology
    replacedStr = replaceImages(replacedStr);

    let cObj={};
    cObj.replacedStr = replacedStr;
    cObj.options = options;
    cObj.rType = rType;
    cObj.cId = cId;
    cObj.url  = 'url'; //This field is used by lorUser to set URL, not required here hence passing 'url'
    cObj.email = contentObj.customerDetails[0].email;
    cObj.cusName = contentObj.customerDetails[0].firstName + " " + contentObj.customerDetails[0].lastName;
    //console.log('html2pdf - prepareHtmlContents() - Email Ids for sending email: ', cObj.email);

    //Calling the HTML to PDF conversion
    convertToPdf(cObj, contentObj);
}

function replaceImages(replacedStr)
{
    let imgPathObj ={};
    imgPathObj.report_main = '../../../config/templates/pdfreport/report_main.jpg';
    imgPathObj.contactus2 = '../../../config/templates/pdfreport/contactus2.jpg';

    //replacedStr = replacedStr.replace('{{report_main}}', reqResolve(imgPathObj.report_main));
    //replacedStr = replacedStr.replace('{{contactus2}}', reqResolve(imgPathObj.contactus2));
    
    replacedStr = replacedStr.replace('{{report_main}}', `file://${require.resolve(imgPathObj.report_main)}`);
    replacedStr = replacedStr.replace('{{contactus2}}', `file://${require.resolve(imgPathObj.contactus2)}`);
    
    /*
    replacedStr = replacedStr.replace('{{report_main}}', 
    `file://${require.resolve('../../../config/templates/pdfreport/report_main.jpg')}`);
    */    

    return replacedStr;
}

function reqResolve(imgPath)
{
    let iPath='';
    iPath = `file://${require.resolve(imgPath)}`;
    return iPath;
}
/*
* This method is used to set values for Property Section
*/
function replaceProp(contentObj, replacedStr)
{
    replacedStr = replacedStr.replace(/#propertyName/i, contentObj.propertyDetails[0].propertyName);
    replacedStr = replacedStr.replace(/#propDesc/i, contentObj.propertyDetails[0].propertyDescription);
    replacedStr = replacedStr.replace(/#propertyType/i, contentObj.propertyDetails[0].propertyType);
    replacedStr = replacedStr.replace(/#propertyLocation/i, contentObj.propertyDetails[0].propertyLocation);
    replacedStr = replacedStr.replace(/#propertyCountry/i, contentObj.propertyDetails[0].propertyCountry);
    replacedStr = replacedStr.replace(/#propertyState/i, contentObj.propertyDetails[0].propertyState);
    replacedStr = replacedStr.replace(/#propertyDistrict/i, contentObj.propertyDetails[0].propertyDistrict);
    replacedStr = replacedStr.replace(/#plotNumber/i, contentObj.customerDetails[0].propertyNumber);
    //TODO: hardcoded Sqft. Need to remove when more values like hectare, etc are added.
    replacedStr = replacedStr.replace(/#plotArea/i, contentObj.customerDetails[0].area + 'Sqft');
    replacedStr = replacedStr.replace(/#propertyArea/i, contentObj.propertyDetails[0].propertyArea);
    replacedStr = replacedStr.replace(/#propertyUnits/i, contentObj.propertyDetails[0].propertyUnits);
    replacedStr = replacedStr.replace(/#statutoryStatus/i, contentObj.propertyDetails[0].statutoryStatus);
    replacedStr = replacedStr.replace(/#highlights/i, contentObj.propertyDetails[0].highlights);


    return replacedStr;
}

/*
* This method is used to set values for Weather Section
*/
function replaceWeather(contentObj, replacedStr)
{
    replacedStr = replacedStr.replace(/#cityName/i, contentObj.weatherDetails[0].city);
    replacedStr = replacedStr.replace(/#weaDesc/i, contentObj.weatherDetails[0].weaDesc);
    replacedStr = replacedStr.replace(/#minTemp/i, contentObj.weatherDetails[0].minTemp.value + ' °C');
    replacedStr = replacedStr.replace(/#maxTemp/i, contentObj.weatherDetails[0].maxTemp.value + ' °C');
    replacedStr = replacedStr.replace(/#windSpeed/i, contentObj.weatherDetails[0].windSpeed.value + ' km/h');
    replacedStr = replacedStr.replace(/#windDegree/i, contentObj.weatherDetails[0].windDegree.value);
    replacedStr = replacedStr.replace(/#sunRise/i, contentObj.weatherDetails[0].sunrise);
    replacedStr = replacedStr.replace(/#sunSet/i, contentObj.weatherDetails[0].sunset);
    replacedStr = replacedStr.replace(/#weaIcon/i, contentObj.weatherDetails[0].weaIcon);
    replacedStr = replacedStr.replace(/#pressure/i, contentObj.weatherDetails[0].pressure);
    
    return replacedStr;
}

/*
* This method is used to set values for Property Section
*/
function replaceUpcomingProp(contentObj, replacedStr)
{
    replacedStr = replacedStr.replace(/#propertyName/i, contentObj.upcomingPropertyDetails[0].propertyName);
    replacedStr = replacedStr.replace(/#propDesc/i, contentObj.upcomingPropertyDetails[0].propertyDescription);
    replacedStr = replacedStr.replace(/#propertyType/i, contentObj.upcomingPropertyDetails[0].propertyType);
    replacedStr = replacedStr.replace(/#propertyLocation/i, contentObj.upcomingPropertyDetails[0].propertyLocation);
    replacedStr = replacedStr.replace(/#propertyDistrict/i, contentObj.upcomingPropertyDetails[0].propertyDistrict);
    replacedStr = replacedStr.replace(/#propertyArea/i, contentObj.upcomingPropertyDetails[0].propertyArea);
    replacedStr = replacedStr.replace(/#propertyUnits/i, contentObj.upcomingPropertyDetails[0].propertyUnits);
    replacedStr = replacedStr.replace(/#statutoryStatus/i, contentObj.upcomingPropertyDetails[0].statutoryStatus);    

    return replacedStr;
}


exports.prepareHtmlContents = prepareHtmlContents;