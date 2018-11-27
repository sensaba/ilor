const request = require('request');
const config = require('config');
const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
const Joi = require('joi');
const csc = require('country-state-city');

let SchemaTypes = mongoose.Schema.Types;
const weatherSchema = new mongoose.Schema(
    {
        country: String,
        state: String,
        city: String,
        longitude: {type: SchemaTypes.Double, default: 0.0},
        latitude: {type: SchemaTypes.Double, default: 0.0},
        weaDesc: String,
        weaIcon: String,
        avgTemp: {type: SchemaTypes.Double}, //convert the input kelvin to celsius and store - data - 273.15 give C
        minTemp: {type: SchemaTypes.Double}, //convert the input kelvin to celsius and store - data - 273.15 give C
        maxTemp: {type: SchemaTypes.Double}, //convert the input kelvin to celsius and store - data - 273.15 give C
        pressure: String,
        humidity: Number,
        windSpeed: {type: SchemaTypes.Double},
        windDegree: {type: SchemaTypes.Double},
        weatherDate: {type: Date, default: Date.now},
        sunrise: {type: Date},
        sunset: {type: Date},
        activeFlag: {type: Boolean, default: true},
        modifiedOn: {type: Date, default: Date.now}
    });
        
    const WeatherData = mongoose.model('WeatherDetails', weatherSchema);
    

async function getWeather(inObj)
{
    let endPoint = config.get('weather.endpoint');
    let apiKey = config.get('weather.apikey');
    let appId = config.get('weather.appid');
    
    let countryShortName;
    let completeCountry = await csc.getAllCountries();
    for (i=0; i<completeCountry.length; i++)
    {
        if (completeCountry[i].name === inObj.country)
        {
            countryShortName = completeCountry[i].sortname;            
        }
    }
    console.log('countryShortName: ', countryShortName);
    let url = endPoint + inObj.city + "," + countryShortName + appId + apiKey;
    return new Promise((resolve, reject) =>
    {
        //console.log('Weather Report Url: ', url);
        request(url, function(error, response, body)
        {
            if (error)
            {
                console.log('weatherMod Error: ', error);
                reject(error);
            }                
            else
            {                
                //console.log('statusCode:', response && response.statusCode); 
                //console.log('------------body:', body);
                storeWeather(body);
                resolve(true);
            }
            //break the body into columns and store them into mondodb
        });
    });
}

/*
* This method is used to store the Weather Data to the db
*/
function storeWeather(bodyObj)
{    
    let dat = new Date(0);
    let newObj = JSON.parse(bodyObj);
    let insObj = {};

    if (newObj.cod == '200')
    {
        insObj.country=newObj.sys.country;
        insObj.state='';
        insObj.city=newObj.name;
        insObj.longitude=newObj.coord.lon;
        insObj.latitude=newObj.coord.lat;
        insObj.weaDesc=newObj.weather[0].description;
        insObj.weaIcon=newObj.weather[0].icon + ".png";
        insObj.avgTemp=(newObj.main.temp - 273.15).toFixed(2);
        insObj.minTemp=(newObj.main.temp_min - 273.15).toFixed(2);
        insObj.maxTemp=(newObj.main.temp_max - 273.15).toFixed(2);
        insObj.pressure=(newObj.main.pressure + " Hetropascals");
        insObj.humidity=newObj.main.humidity;
        insObj.windSpeed=newObj.wind.speed;
        insObj.windDegree=newObj.wind.deg;    
        insObj.weatherDate=new Date(dat.setUTCSeconds(newObj.dt));
        dat = new Date(0);
        insObj.sunrise=new Date(dat.setUTCSeconds(newObj.sys.sunrise));
        dat = new Date(0);
        insObj.sunset=new Date(dat.setUTCSeconds(newObj.sys.sunset));
    
        console.log('Inserting data to Weather db....');
        let weatherRec = new WeatherData(insObj);
        let result = weatherRec.save();
    }
}

/*
* This method is used to get the weather data from DB.
*/
async function getWeatherData(weaObj, carryObj)
{
    //Add DATE to get the data as required    
    let rejData = {};
    let weaData = await WeatherData
    .find({activeFlag: true, city:weaObj.city})
    .select({city: 1, weaDesc: 1, weaIcon:1, avgTemp: 1, minTemp: 1, maxTemp: 1, pressure: 1, 
        humidity: 1, windSpeed: 1, windDegree: 1, sunrise: 1, sunset: 1, _id:0});
        
    return new Promise((resolve, reject) =>
    {
        if (weaData != null)
        {
            carryObj.weatherDetails = weaData;
            //console.log('getWeatherData() - Result: ', carryObj);
            resolve(carryObj);
        }           
        else
            reject(rejData);
    });
}

//exports.Weather = WeatherData;
exports.getWeather = getWeather;
exports.getWeatherData = getWeatherData;