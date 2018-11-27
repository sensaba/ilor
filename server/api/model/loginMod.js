const mongoose = require('mongoose')
const Joi = require('joi');
const config = require('config');

/*
* This collection (table in sql) is to hold all the customer login details
*/
const userLoginSchema = new mongoose.Schema(
{
    cusId: Number,
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    guiStage: String,
    userSince: {type: Date, default: Date.now },
    lastLogin: {type: Date, default: Date.now }, 
    activeFlag: {type: Boolean, default: true}
});
    
//LorUser is a class returned by monoose.model
const LorUser = mongoose.model('LorUser', userLoginSchema);

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
