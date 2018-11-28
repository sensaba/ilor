const scheduler = require('node-schedule');
const {getCityCountry, customerDataForReports, getUsersByEmail} = require('../model/userMod');
const {getWeather, getWeatherData} = require('../model/weatherMod');
const {getPropertyBydeveloper, getUpcomingProperty} = require('../model/propertyMod');
const {downloadFiles} = require('./ftp');
const {prepareHtmlContents} = require('./html2pdf');
const {loadXLS} = require('./handleXLS');
const config = require('config');

//Runs every minute
//let rule = scheduler.scheduleJob('*/1 * * * *', function()
//{
//    console.log('Prints at: ', new Date().toLocaleString());
//});
//let rule = scheduler.scheduleJob('*/50 * * * * *', function () //For testing, executing every 50 seconds


/*
* Cron Job to start Weather data collection once a day in the evening at 9:00 PM local time
*/
function loadWeather()
{
    let cityCountry={};
    let weaObj={};
    const cronHours = config.get('cronTimings.weatherLoad');
    
    let loadwearule = new scheduler.RecurrenceRule();
    loadwearule.hour = cronHours;
    loadwearule.minute = 00;
    loadwearule.second = 00;    

    let rule = scheduler.scheduleJob(loadwearule, function()
    //let rule = scheduler.scheduleJob('*/21 * * *', function()    
    {        
        getCityCountry().then(res => 
        {
            console.log('Cron Job - loadWeather() - Logging at: ', new Date().toLocaleString());        
            //console.log('Cron Job - City Country: ', res);
            for (i=0; i<res.length; i++)
            {
                //console.log('Cron - loadWeather - City: ', res[i]._id.propertyDistrict);
                //console.log('Cron - loadWeather - Country: ', res[i]._id.propertyCountry);
                weaObj.city = res[i]._id.propertyDistrict;
                weaObj.country = res[i]._id.propertyCountry;
                console.log('Cron Job - loadWeather() - weaObj: ', weaObj);

                //Call the Weather API to get the weather and store into db
                getWeather(weaObj).then(result =>
                {
                    //console.log('Cron - loadWeather - Result from Weather API: ', result);                    
                });
            }
        }).catch(error => console.log(error));
    });
}

/*
* This cron will monitor FTP for all required new files 
*/
function monitorFTP()
{
    let location = config.get('ftpLocation');
    let locObj = {};
    locObj.local = location.localDriveCustomer;
    locObj.server = location.ftpServerCustomer;
    //console.log('monitorFTP - locObj: ', locObj);

    let locObj1 = {};
    locObj1.local = location.localDriveProperty;
    locObj1.server = location.ftpServerProperty;
    //console.log('monitorFTP - locObj1: ', locObj1);

    let ftprule = new scheduler.RecurrenceRule();
    ftprule.minute = config.get('cronTimings.ftpLoad');
    ftprule.second = 00;
    
    //Change it to run every 30 mins
    let ftpmonitor = scheduler.scheduleJob('*/30 * * * *', function() 
    {
        console.log('Cron - monitorFTP - Invoked : ', new Date().toLocaleString());
        let cusStatus = downloadFiles(locObj, function(bool)
        {
            //console.log('Response from FTP - Customer: ', bool);
            if (bool)
            {
                //console.log('Response from FTP - Customer - TRUE');
                //Load, Read and Write XLS data to DB.
                loadXLS('customer');
            }
        });
        

        let propStatus = downloadFiles(locObj1, function(bool)
        {
            //console.log('Response from FTP - Property: ', bool);
            if (bool)
            {
                //console.log('Response from FTP - Property - TRUE');
                //Load, Read and Write XLS data to DB.
                loadXLS('property');
            }
        });        
    });
}

/*
* This cron will check the customers to whom reports are to be emailed 
*/
function sendReports()
{        
    //{minute: config.get('cronTimings.ftpLoad')}
    let repSender = scheduler.scheduleJob('*/4 * * * *', function()    //for test, it runs every 10 secs
    {
        //console.log('........ STARTING Send Reports CRON.......');        
        let propObj={};        
        customerDataForReports().then(res => 
        {
            console.log('Cron - sendReport - customerDataForReports() - Invoked : ', new Date().toLocaleString());
            //console.log('Cron - sendReport - customerDataForReports() - Result : ', res);
            //make an array of emailids to get the details.
            if (res != null && res.length > 0)
            {
                let i;
                for (i in res)
                {
                    //call the method which takes email array as input and returns user data.
                    getUsersByEmail(res[i].email).then(nres =>
                    {
                        //console.log('Cron - sendReport - getUsersByEmail() - Result: ', nres);
                        //make an array of developer and propertyname and get the details from property collection / table
                        propObj.developer = nres[0].propertyDeveloper;
                        propObj.name = nres[0].propertyName;
                        //console.log('propObj Values: ', propObj);                    
                        getPropertyBydeveloper(propObj, nres).then(pres =>
                        {
                            //console.log('Cron - sendReport - getPropertyBydeveloper() - Result: ', pres);
                            //get the weather, soil, sociology, cultural, vastu and economic details of the property                        
                            let wObj = {};
                            wObj.country = pres.propertyDetails[0].propertyCountry;
                            wObj.city = pres.propertyDetails[0].propertyDistrict;
                            //console.log('Weather Object: ', wObj);
                            getWeatherData(wObj, pres).then(wres =>
                            {                            
                                //console.log('Cron - sendReport - getWeatherData() - Result: ', wres);                            
                                //console.log('Weather Object ---------', wres.weatherDetails[0].minTemp.value);
                                let upObj={};
                                upObj.developer = wres.propertyDetails[0].developer;
                                getUpcomingProperty(upObj, wres).then(upres =>
                                {
                                    //call html2pdf and send email
                                    prepareHtmlContents(upres);
                                });
                            });
                        });
                    });                
                }    
            }
        });
    });

    /*
    let location = config.get('reportDef');
    //Dynamically getting all the values irrespective of key and value
    Object.keys(location).forEach(function (name)
    {
        let data = {name: name};
        data.url = location [name];
        console.log(name + " - " + data.url);
    });
    */
}


exports.sendReports = sendReports;
exports.loadWeather = loadWeather;
exports.monitorFTP = monitorFTP;