const mongoose = require('mongoose');
const config = require('config');

//Report Type
const reportTypeSchema = new mongoose.Schema(
{    
    reportType: String,
    lastModified: {type: Date, default: Date.now }, 
    activeFlag: {type: Boolean, default: true}
});    
const ReportTypes = mongoose.model('ReportType', reportTypeSchema);

//Property Type
const propertyTypeSchema = new mongoose.Schema(
{
    propertyType: String,
    lastModified: {type: Date, default: Date.now }, 
    activeFlag: {type: Boolean, default: true}
});        
const PropertyTypes = mongoose.model('PropertyType', propertyTypeSchema);

/* ----------------------------- Code to insert static data based on config - Start ----------------------------- */
function createReportTypes()
{
    let repType = ['Basic', 'Silver', 'Gold', 'Platinum'];

    for (i=0; i<repType.length; i++)
    {
        const insReportType = new ReportTypes(
        {
            reportType: repType[i]        
        });    
        let result = insReportType.save();            
        console.log('Report Types Inserted...', result);
    }  
}

function createPropertyTypes()
{
    let propType = ['Plot', 'Layout', 'Land Bank'];

    for (i=0; i<propType.length; i++)
    {
        const insPropertyType = new PropertyTypes(
        {
            propertyType: propType[i]        
        });    
        let result = insPropertyType.save();            
        console.log('Property Types Inserted...', result);
    }    
}

function loadStaticData()
{
    return new Promise((resolve, reject) =>
    {
        if (config.get('loadStaticData.reporttype'))
            createReportTypes();

        if (config.get('loadStaticData.propertytype'))
            createPropertyTypes();
        
        resolve('Successful !');
    });    
}

/* ------------------------------ Code to insert static data based on config - End ------------------------------ */

exports.loadData = loadStaticData;
exports.ReportTypes = ReportTypes;
exports.PropertyTypes = PropertyTypes;