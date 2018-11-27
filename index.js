const express = require('express');
const mongoose = require('mongoose');
const debug = require('debug')('app:startup');
const config = require('config');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require("path");
const logger = require('./server/api/util/logger');
const userRout = require("./server/api/routes/lorUser");
const staticRout = require("./server/api/routes/staticData");
const download = require("./server/api/routes/fileDownload");
const weaData = require("./server/api/routes/weather");
const propertyData = require("./server/api/routes/property");
// const home = require('./api/routes/home');
const {loadWeather, monitorFTP, sendReports} = require('./server/api/util/cronJobs');
const app = express();

//Connect to mongodb once at start - index.js
//mongoose.connect('mongodb://localhost:27017/lor', {useNewUrlParser: true})
mongoose.connect('mongodb://ilordb:i10rdb@cluster0-shard-00-00-cg4hm.mongodb.net:27017,cluster0-shard-00-01-cg4hm.mongodb.net:27017,cluster0-shard-00-02-cg4hm.mongodb.net:27017/lor?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true', {useNewUrlParser: true})
.then(() => console.log('Connected to MongoDB..'))
.catch(err => console.error('Could not connect to MongoDB..'));

// app.set('view engine', 'pug'); //require is not essential when you load like this.
// app.set('views', '../lor/views');
app.use(express.json()); //This is a middleware function which sets the req.body property
app.use(express.static('public'));
app.use(helmet());
app.use(express.static(`${__dirname}/./app`));

app.get('/', (req, res) => 
{
    res.sendFile(path.join(__dirname, './app/index.html'));
});

//------------------------------------------------------------
//Call all the crons to load the data, etc.
loadWeather();
monitorFTP();
sendReports();
//------------------------------------------------------------

app.use('/wsapi/customer', userRout);
app.use('/wsapi/static', staticRout);
app.use('/wsapi/download', download);
app.use('/wsapi/util', weaData);
app.use('/wsapi/prop', propertyData);
// app.use('/', home);
app.use(logger);
logger('All setup required is completed...');

//set NODE_ENV=development as an environment variable for this to work..
if (app.get('env') === 'development')
{
    app.use(morgan('tiny'));
    console.log('Development - Morgan enabled...');
}

//set DEBUG=app:startup as an environment variable for this to appear.
debug('Application Name from config: ' + config.get('name'));
debug('Mail server from config: ' + config.get('mail.service'));
//set lorsendermailpwd=actual password as an environment variable for this to work

//Starting to listen to port 3000 if env.port is not set.
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Lor listening on port: ${port}`));

module.exports = app;
