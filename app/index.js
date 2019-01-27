/*
 * Primary file for the API
 *
 */
// Dependencies
const http = require('http');
let url = require('url');
let StringDecoder = require('string_decoder').StringDecoder;

// The server shold response to all requests with a string
var server = http.createServer(function(req, res){

    //Get the URL and parse it
    // Note: cache should not be re-used by repeated calls to JSON.stringify.
    var cache = [];
    request = JSON.stringify(req, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Duplicate reference found
                try {
                    // If this value does not reference a parent it can be deduped
                    return JSON.parse(JSON.stringify(value));
                } catch (error) {
                    // discard key if value cannot be deduped
                    return;
                }
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    }, 4);
    cache = null; // Enable garbage collection
    console.log(`${request} \n`);

    //Get the URL and parse it
    console.log(`Raw URL is ${req.url}\n`);
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    console.log(`Parsed URL is ${JSON.stringify(parsedUrl)}\n`);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'')

    //Get the HTTP Method
    var method = req.method.toUpperCase();

    //Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //Get request headers as an object
    var headers = req.headers;

    //Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();
        
        // Choose handler based on request path matched with one in router, 
        // if not found, set to notFound handler
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath] : handlers.notFound;

        // Construct data object to be sent to handlers
        var data = {
            'method' : method,
            'headers' : headers,
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'payload' : buffer
        }

        choosenHandler(data, function(statusCode, payload){

            // Use status code received from handler or set the default code = 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            // Use payload received from handler or set the default payload to an empty object
            payload = typeof(payload) == 'object'? payload : {};
            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            
            //Send the response
            res.end(payloadString)

            // Log the request path
            console.log(`Request is received on path ${trimmedPath} with method ${method} 
            and query string`,queryStringObject, ` and these headers`, headers,
            `and this payload `, buffer);

            console.log("Returning this response: ",statusCode,payloadString);

        })

    });
    console.log(`Waiting ..`);    
});

// Start the server, and have it listen on port 3000
server.listen(3000,function(){
    console.log("The server is listening on port 3000 now");
    })

// Define handlers
var handlers = {};

// Sample Handler
handlers.sample = function (data, callback){
    callback (406, {'name':'sample handler'});
}

//Not found Handler
handlers.notFound = function (data, callback){
    callback (404);
}

// Define the request router
router = {
    'sample' : handlers.sample
}