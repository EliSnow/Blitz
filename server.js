//derived from https://gist.github.com/1926868
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    mime = require("mime"),
    port = parseInt(process.argv[2], 10) || 8888;

http.createServer(function(request, response) {

	var uri = url.parse(request.url).pathname,
		filename = path.join(process.cwd(), uri);

	fs.readFile(filename, "binary", function(err, file) {
		if (err) {        
			response.writeHead(302, {"Location": "/test/test.html"});
		} else {
			response.writeHead(200, {"Content-Type": mime.lookup(filename)});
			response.write(file, "binary");
		}
		response.end();
	});		

}).listen(port);

console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");