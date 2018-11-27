const { getWeather, Weather} = require('../model/weatherMod');
const config = require('config');
const internet = require('is-reachable');
const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();

let jsonParser = bodyParser.json();

/*
* This method is used to insert Weather data to db
*
* Parameter to be set: State and Country 
* Method call from GUI: /wsapi/util/wea
*/
router.post('/wea', jsonParser, async (req, res, next) => 
{
    let weaQry = _.pick(req.body, ['city', 'country']);
    console.log('Weather Request:', weaQry);
    
    getWeather(weaQry)
    .then(bdy => res.status(200).send(bdy))
    .catch(err => next(err));    
});

module.exports = router;