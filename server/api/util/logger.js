
function log(req, res, next)
{
    console.log();
    //next(); //Do we need the next function invocation? Without this, it is working fine.. check
}

module.exports = log;