const _ = require('lodash');
const mongoose = require('mongoose');
const config = require('config');
const { LorUser, validateCusParams} = require('../model/userMod');
const { PropertyDetails, validateProp} = require('../model/propertyMod');
const XLSX = require('xlsx');
const fs = require('fs');

//Call this method to load, read and write xls data to DB.
function loadXLS(loadObj)
{
    let workbook;
    let readObj = {};
    if (loadObj != null && loadObj === 'customer')
    {        
        workbook = XLSX.readFile(config.get('ftpLocation.localDriveCustomer') 
        + config.get('ftpLocation.cusFileName'), {cellDates:true});
        readObj.type = 'customer';
        readObj.wbook = workbook;

        readXLS(readObj);
    }
    else if(loadObj != null && loadObj === 'property')
    {   
        workbook = XLSX.readFile(config.get('ftpLocation.localDriveProperty')
        + config.get('ftpLocation.propFileName'), {cellDates:true});
        readObj.type = 'property';
        readObj.wbook = workbook;       

        readXLS(readObj);        
    }
    else    
        console.log('handleXLS - Improper options');    
}

function readXLS(rObj)
{
    //const sheet_name_list = workbook.SheetNames;
    let newWB = rObj.wbook;
    const sheet_name_list = newWB.SheetNames;
    //console.log('Sheet Name: ', sheet_name_list);
    let tempUser = XLSX.utils.sheet_to_json(newWB.Sheets[sheet_name_list[0]]);
    let movflag = false;
    let mObj={};    
    let userObj = {};

    for (i in tempUser)
    {
        //console.log(`tempUser ${i}: `, tempUser[i]);
        for(j in tempUser[i])
        {
            //console.log('tempUser[i]: ', tempUser[i]);
            //console.log(`tempUser: ${j}: `, tempUser[i][j]);        
            let objKey = [j];
            userObj[j] = tempUser[i][j];        
        }
        if (rObj.type === 'customer')
        {
            storeCustomerData(userObj, function(bool)
            {
                mObj={};
                movflag = true;
                mObj.from = config.get('ftpLocation.localDriveCustomer') + config.get('ftpLocation.cusFileName');
                mObj.to = config.get('ftpLocation.localArchiveCustomer') + config.get('ftpLocation.cusFileName');            
            });            
        }   
        else if(rObj.type === 'property')
        {   
            storePropertyData(userObj, function(boolres)
            {
                mObj={};
                movflag = true;                
                mObj.from = config.get('ftpLocation.localDriveProperty')+ config.get('ftpLocation.propFileName');
                mObj.to = config.get('ftpLocation.localArchiveProperty')+ config.get('ftpLocation.propFileName');
            });
        }
    }
    if (movflag)
        moveFile(mObj);
    else
        console.log('No files to move');
}

function storeCustomerData(userObj, cb)
{
    let saveStatus = false;
    const {error} = validateCusParams(userObj);
    if (error) 
    {
        console.log('handleXLS - storeCustomerData - Data Validation Error : ', error.details);
        cb(saveStatus);
    }
    else
    {    
        let lorUserDetail = new LorUser(
            _.pick(userObj, 
                ['firstName', 'lastName', 'email', 'phone', 'state', 'country',
            'ownaproperty','propertyDeveloper','propertyName','propertyType',
            'area','measure','propertyNumber','propertyCountry','propertyState','propertyDistrict',
            'ratePerSq','dateBought','reportSubscribed','reportType','paymentMade','referringCompany']));
    
        //console.log('lorUserDetail: ', lorUserDetail);    
        lorUserDetail.save();        
        console.log('handleXLS - storeCustomerData - User data saved to database successfully !');
        saveStatus = true;
        cb(saveStatus);
    }    
}

function storePropertyData(userObj, cb)
{
    let saveStatus = false;
    const {error} = validateProp(userObj);
    if (error) 
    {
        console.log('handleXLS - storeCustomerData - Data Validation Error : ', error.details);
        cb(saveStatus);
    }
    else
    {    
        let propertyDetail = new PropertyDetails(
            _.pick(userObj, 
                ['developer', 'propertyName', 'propertyDescription', 'highlights', 'propertyType',
            'propertyArea','propertyUnits','propertyLocation','propertyCountry','propertyState','propertyDistrict',
            'statutoryStatus', 'statutoryDetail','propertyStatus', 'amenities']));
        
        //console.log('propertyDetail: ', propertyDetail);
        propertyDetail.save();
        console.log('handleXLS - storePropertyData - Property data saved to database successfully !');  
        saveStatus = true;
        cb(saveStatus);
    }
}

function moveFile(movObj)
{
    fs.rename(movObj.from, movObj.to, (err)=>
    {
        if (err)
            console.log('handleXLS - moveFile - File NOT moved successfully');
        else
            console.log('handleXLS - moveFile - File moved successfully');
    });
}

exports.loadXLS = loadXLS;