var StaticServer = require('static-server');
var port = process.env.PORT || 3000;
var server = new StaticServer({
    rootPath: './build',            // required, the root of the server file tree 
    port: port,               // optional, defaults to a random port 
});

server.start(function () {
    console.log('Server listening to', server.port);
});