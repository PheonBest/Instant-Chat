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
var connected = [];

io.sockets.on('connection', (socket)=>{
	setTimeout(() => {
		socket.emit('history', allMessages);
	}, 100);

	socket.on('forceUsernameReached',(username)=>{
		socket.username = username;
	})
	.on('messageReached',(message)=>{
		if (message.length-(socket.username.length+2)<500){
			var sendError = true;
			for (var i=0;i<message.length;i++){
				if (message[i] !== ' '){
					sendError = false
					console.log(message);
					socket.broadcast.emit('message', message);
					if (allMessages.length > 49){
						allMessages.splice(0, 1);
					}
					allMessages.push(message);
					break
				}
				if (sendError) {
					socket.emit('messageError', message, 'Votre message ne doit pas être vide');
				}
			}
		}
		else {
			socket.emit('messageError', message, 'Votre message doit faire moins de 500 caractères');
		}
	})
	.on('pseudoReached',(pseudo)=>{
		if (pseudo.length < 3) {
			socket.emit('pseudo', 0, 'Votre pseudonyme doit faire plus de 2 caractères');
		} else if (pseudo.length > 20) {
			socket.emit('pseudo', 0, 'Votre pseudonyme doit faire moins de 20 caractères');
		} else {
			var i;
			var shouldCOntinue = true;
			for (i=0; i < connected.length; i++) {
				if (pseudo == connected[i]) {
					socket.emit('pseudo', 0, 'Votre pseudonyme est déjà utilisé');
					shouldCOntinue = false;
					break
				}
			}
			if (shouldCOntinue) {
				socket.username = pseudo;
				connected.push(pseudo);
				socket.emit('pseudo', 1, pseudo);
			}
		}
	})
	.on('isUsernameAvailable',(pseudo)=>{
		var shouldCOntinue = true;
		for (i=0; i < connected.length; i++) {
			if (pseudo == connected[i]) {
				socket.emit('messageError', "", 'Votre pseudonyme est déjà utilisé');
				shouldCOntinue = false;
				socket.emit('usernameAvailable', "")
				break
			}
		}
		if (shouldCOntinue) {
			socket.username = pseudo;
			connected.push(pseudo);
			socket.emit('usernameAvailable', pseudo)
		}
	})
	.on('disconnect', function() {
      console.log('Got disconnect!');

      var i = connected.indexOf(socket.username);
      connected.splice(i, 1);
    });
});
