const mongoose = require('mongoose');
const Joi = require('joi');

/*
* This collection (table in sql) is to hold all the property details
* The property details are provided by the Developers who are about to use ilor 
* 
*/
const propertySchema = new mongoose.Schema(
{
    developer: {type: String, required: true},
    //email: {type: String, required: true, unique: true}, //when unique is provided, duplicate emails cannot be stored
    //pwd: {type: String, default: 'Welcome@123'},
    phone: {type: String},
    country: String,
    state: String,
    propertyName: {type: String, required: true},
    propertyDescription: String,
    highlights: String,
    propertyType: String,
    propertyArea: String,
    propertyUnits: String,
    propertyLocation: String,    
    propertyCountry: String,
    propertyState: String,
    propertyDistrict: String,
    statutoryStatus: String,
    statutoryDetail: String,
    propertyStatus: String,    
    amenities: String,
    mailFrequency: {type: Number, default: 15},
    paymentMade: {type: Number, default: 0},
    userSince: {type: Date, default: Date.now },
    lastLogin: {type: Date, default: Date.now }, 
    activeFlag: {type: Boolean, default: true}
});
    
//PropertyDetails is a class returned by monoose.model
const PropertyDetails = mongoose.model('PropertyDetails', propertySchema);

/*
* This function is used to validate the data provided from calling program
* This function makes use of Joi package
*/
function validatePropParams(propObj)
{    
    const propSchema = 
    {
        developer: Joi.string().required(),
        propertyName: Joi.string().required(),
        propertyDescription: Joi.string().required(),
        highlights: Joi.string(),
        propertyType: Joi.string().required(),
        propertyArea: Joi.string(),
        propertyUnits: Joi.any().optional(),
        propertyLocation: Joi.string(),
        propertyCountry: Joi.string(),
        propertyState: Joi.string(),
        propertyDistrict: Joi.string(),
        statutoryStatus: Joi.string(),
        statutoryDetail: Joi.string(),
        propertyStatus: Joi.string().required(),        
        amenities: Joi.string()
    };
    return Joi.validate(propObj, propSchema);
}


//Function to provide all developrs
async function getPropertyDevelopers()
{    
    let propertyData;
    await PropertyDetails
    .find({activeFlag: true})
    .distinct('developer', function (error, val)
    {
        if (error)
            throw error;        
        
        propertyData = val;
    });    
    return new Promise((resolve, reject) =>
    {
        resolve(propertyData);                
    });
}

//Function to provide all property names of each developer
async function getPropertyName(devObj)
{
    //Ongoing value has to be made lower case and restricted as drop down in excel sheet.
    let proStatus = 'Ongoing';
    let propertyNames;
    await PropertyDetails
    .find({activeFlag: true, developer: devObj, propertyStatus: 'Ongoing'})
    .distinct('propertyName', function (error, val)
    {
        if (error)
            throw error;        
        
        propertyNames = val;
    });    
    return new Promise((resolve, reject) =>
    {
        resolve(propertyNames);                
    });
}

//Function to provide country, state and city details based on property name
async function getPropertyLocation(locObj)
{     
    let rejData = {};
    let propertyLocation = await PropertyDetails
    .find({activeFlag: true, developer: locObj.developer, propertyName: locObj.propertyName})
    .select({propertyCountry: 1, propertyState: 1, propertyDistrict: 1, _id:0});

    return new Promise((resolve, reject) =>
    {
        if (propertyLocation != null)
            resolve(propertyLocation);
        else
            reject(rejData);
    });
}

//Gets all the users based on email id.
async function getPropertyBydeveloperAndName(proObj, carryObj)
{    
    let rejData = {};
    let propertyObj={};
    let propData = await PropertyDetails
    .find({developer: proObj.developer, propertyName: proObj.name, activeFlag: true})
    .select({developer: 1, propertyName: 1, highlights:1, propertyType: 1, propertyArea: 1, 
        propertyUnits: 1, propertyLocation: 1, propertyCountry: 1, propertyState: 1, propertyDistrict: 1, 
        statutoryStatus: 1, statutoryDetail: 1, propertyStatus: 1, amenities: 1, propertyDescription: 1, _id:0});
    
    return new Promise((resolve, reject) =>
    {
        if (propData != null)
        {
            propertyObj.propertyDetails = propData;
            propertyObj.customerDetails = carryObj;
            resolve(propertyObj);
        }            
        else
            reject(rejData);
    });
}

//Gets all the users based on email id.
async function getUpcomingPropertyByDeveloper(proObj, carryObj)
{    
    let rejData = {};
    let propertyObj={};
    let propData = await PropertyDetails
    .find({developer: proObj.developer, propertyStatus: 'Upcoming', activeFlag: true})
    .select({developer: 1, propertyName: 1, highlights:1, propertyType: 1, propertyArea: 1, 
        propertyUnits: 1, propertyLocation: 1, propertyCountry: 1, propertyState: 1, propertyDistrict: 1, 
        statutoryStatus: 1, statutoryDetail: 1, propertyStatus: 1, amenities: 1, propertyDescription: 1, _id:0});
    
    return new Promise((resolve, reject) =>
    {
        if (propData != null)
        {
            carryObj.upcomingPropertyDetails = propData;
            resolve(carryObj);
        }            
        else
            reject(rejData);
    });
}

exports.getUpcomingProperty = getUpcomingPropertyByDeveloper;
exports.getPropertyLocation = getPropertyLocation;
exports.getPropertyBydeveloper = getPropertyBydeveloperAndName;
exports.developers = getPropertyDevelopers;
exports.propertyNames = getPropertyName;
exports.PropertyDetails = PropertyDetails;
exports.validateProp = validatePropParams;