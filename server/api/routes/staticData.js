const { ReportTypes, PropertyTypes, loadData} = require('../model/staticDataMod');
const csc = require('country-state-city');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
let jsonParser = bodyParser.json();

/*
* All the methods in this routes has to be called as /wsapi/static/...
*
* This method is used to populate data to the static tables like ReportType, PropertyType
* Method call from GUI: /wsapi/static/loadData
* Properties file needs to be updated with key "loadStaticData"
*/
router.post('/loadData', async (req, res) =>
{
    await loadData()
    .then(resol => res.status(200).send('Static data load - ' + resol))
    .catch(error => res.status(400).send('Static data load - failed ! ' + error.details));
});

/*
* This method returns reportypes data from the database
* Method call from GUI: /wsapi/static/reportType
* No parameter is required to be set in Angular or calling program
*/
router.get('/reportType', async (req, res) => 
{
    let reportTypes = await ReportTypes
    .find({activeFlag: true})
    .select({reportType: 1, _id: 0});

    //console.log('Report Types returned: ', reportTypes);
    res.status(200).send(reportTypes);
});

/*
* This method returns propertyTypes data from the database
* Method call from GUI: /wsapi/static/propertyType
* No parameter is required to be set in Angular or calling program
*/
router.get('/propertyType', async (req, res) => 
{
    let propertyTypes = await PropertyTypes
    .find()
    .select({propertyType: 1, _id: 0});

    //console.log('Property Types returned: ', propertyTypes);
    res.status(200).send(propertyTypes);
});

/*
* This method will return all the Country details with id, name, etc
* Method call from GUI: /wsapi/static/country
* No parameter is required to be set in Angular or calling program
*/
router.get('/country', async (req, res) => 
{
    let completeCountry = await csc.getAllCountries();
    //console.log('Country list populated......');
    res.status(200).send(completeCountry);
});

/*
* This method returns all corresponding State details for a Country 
* Method call from GUI: /wsapi/static/state
* "countryId" has to be populated in the Angular
*/
router.post('/state', jsonParser,async (req, res) => 
{    
    let states = await csc.getStatesOfCountry(req.body.countryId);
    //console.log('State list populated......');
    res.status(200).send(states);
});

/*
* This method returns all corresponding City details for a State 
* Method call from GUI: /wsapi/static/city
* "stateId" has to be populated in the Angular
*/
router.post('/city', jsonParser,async (req, res) => 
{    
    let cities = await csc.getCitiesOfState(req.body.stateId);
    //console.log('City list populated......');
    res.status(200).send(cities);
});

module.exports = router;