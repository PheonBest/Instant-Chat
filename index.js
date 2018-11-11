var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));
var allMessages = [];

io.sockets.on('connection', (socket)=>{
	socket.emit('history', allMessages);
	socket.on('messageReached',(message)=>{
		socket.broadcast.emit('message', message);
		if (allMessages.length<50){
			allMessages.splice(0, 1);
			allMessages.push(message);
		}
	});
});
