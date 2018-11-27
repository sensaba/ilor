const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
let jsonParser = bodyParser.json();


/*
* This method is used to download sample report files 
* Method call from GUI: /wsapi/download
* "fileName" has to be populated in the Angular
*/
router.post('/', jsonParser, function(req, res)
{
    console.log('File Download sarts....');
    let filePath = '../ilor/app/downloads/';
    let fileName = req.body.fileName;
    console.log('File Name: ', fileName);

    res.setHeader('Content-disposition', 'attachment; filename=' + filePath+fileName);
    res.setHeader('Content-type', 'PDF');

    res.download(filePath+fileName); 
});

module.exports = router;