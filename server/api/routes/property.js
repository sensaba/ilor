const {developers, propertyNames,getPropertyLocation} = require('../model/propertyMod');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();

let jsonParser = bodyParser.json();

/*
* This method returns property developer data from the database
* Method call from GUI: /wsapi/prop/dev
* No parameter is required to be set in Angular or calling program
*/
router.get('/dev', async (req, res) => 
{
    let devData = await developers();
    //console.log('Dev Data -----------------> ', devData);    
    res.status(200).send(devData);
});

/*
* This method returns property names data from the database for the given Developer
* Method call from GUI: /wsapi/prop/proName
* Parameter is required - Send the Developer Name (eg: someObj.developer = 'abc')
*/
router.post('/proName', jsonParser, async (req, res) => 
{
    let propNameData = await propertyNames(req.body.developer);
    //console.log('Property Name Data -----------------> ', propNameData);    
    res.status(200).send(propNameData);
});

/*
* This method returns property location data from the database for the given Developer
* Method call from GUI: /wsapi/prop/proLoc
* Parameter is required - Send the Developer Name and Property name (eg: someObj.developer = 'abc')
*/
router.post('/proLoc', jsonParser, async (req, res) => 
{
    let locObj={};
    locObj.developer = req.body.developer;
    locObj.propertyName = req.body.propertyName;
    let propLocData = await getPropertyLocation(locObj);
    //console.log('Property Location Data -----------------> ', propLocData);    
    res.status(200).send(propLocData);
});

module.exports = router;