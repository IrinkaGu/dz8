// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
  var addedUser = false;

  socket.on('new message', function (data) {
    socket.broadcast.to(socket.room).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('add user', function (username, roomNum) {
    if (addedUser) return;
	
	socket.room = "room"+roomNum;
    socket.username = username;
    socket.join(socket.room);

    addedUser = true;
    numUsers = getCountUser(socket.room);

	socket.emit('login', {
      numUsers: numUsers
    });

    socket.broadcast.to(socket.room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  socket.on('typing', function () {
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', function () {
    if (addedUser) {
      numUsers = getCountUser(socket.room);

      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

function getCountUser(name){
	const clients = io.sockets.adapter.rooms[name];
	const numClients = (typeof clients !== 'undefined') ? Object.keys(clients.sockets).length : 0;
	return numClients;
}