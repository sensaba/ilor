//process.env.NODE_CONFIG_DIR = '../../../config';
const fs = require('fs');
const Client = require('ftp');
const config = require('config');
const internet = require('is-reachable');

function getFilesToLocal(flObj, cb)
{
    //flObj provides file location of FTP Server and Local HD
    let srcFtp = config.get('ftp'); 
    srcFtp.password = 'rcm123';
    //console.log('Ftp Credentials: ', srcFtp);
    
    let local = flObj.local;
    let serverLocation = flObj.server;
    let downloadList = [];
    let cli = new Client();
    let retStatus = false;
    
    cli.on('ready', function()
    {
        //Locating the files in FTP 
        cli.list(serverLocation, function(err, list)
        {
            if (err) 
            {
                console.log('FTP List Error: ', err.message);
                retStatus = false;
                cb(retStatus);
                //throw err;
            }
            
            if (list != null && list.length > 0)
            {
                list.map(function(entry)
                {
                    console.log('FTP - File: ', entry.name);
                    if (entry.name)
                    {
                        //console.log('FTP - File Match: ', entry.name);
                        downloadList.push(entry.name);
                    }
                });
                //Downloading the files to local disk for processing
                downloadList.map(function(file)
                {
                    cli.get(serverLocation + file, function(err, stream)
                    {
                        //console.log('FTP - LOCATION -----> ', serverLocation + file);
                        if(err) 
                            console.log('FTP DownLoadList Error: ', err.message);
                            //throw err;
                        else
                        {
                            stream.once ('close', function() {cli.end();});
                            stream.pipe(fs.createWriteStream(local + file));
                            
                            //After writing to the local, delete the file from Server.                            
                            cli.delete(serverLocation + file, function(err, stream)
                            {                
                                if(err) 
                                    console.log('FTP Delete Error: ', err.message);
                                    //throw err;
                                else
                                {
                                    console.log('FTP - File Deleted from Server: ', file);
                                    retStatus = true;
                                    cb(retStatus);
                                }
                            });                            
                        }    
                    });
                });                
            }
            else
            {
                retStatus = false;
                cb(retStatus);
                console.log('FTP - No files found in the FTP Server for Location: ', serverLocation);                
            }                
            cli.end();
        });
    });
    //check if internet is available before connecting to cloud FTP.
    internet('google.com')
    .then(reachable =>
    {        
        if (reachable)
            cli.connect(srcFtp);
        else
            console.log('FTP - No Internet - Not Logging to Cloud FTP: ');
    })
    .catch(err => 
    {
        console.log('FTP - No Internet - Not Logging to Cloud FTP: ');
    });
}

exports.downloadFiles = getFilesToLocal;