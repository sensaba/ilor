const express = require('express');
const router = express.Router();

router.get('/', (req, res) => 
{
    //res.send('Land optimizer reports ...');
    //using pub
    res.render('index', {title: 'Lor App', message: 'Hello from Pug - Home Page'});
});

module.exports = router;