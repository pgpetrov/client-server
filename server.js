"use strict";
const net = require('net');
var rooms = {};
const server = net.createServer((c) => {
  c.on('data', function(buf) {
    buf = buf.toString();
    console.log(buf);
    var type = buf.split('|')[0];
    console.log(type);
    //type|name|clientRoom
    switch (type) {
      case "new":
          let clientName = buf.split('|')[1];
          let clientRoom = buf.split('|')[2];
          if (!rooms[clientRoom]) {
            rooms[clientRoom] = {
              "host" : clientName,
              "hostSocket" : c
            };
            c.write("host");
            console.log('--------------------------');
            console.log("host came: " + clientName);
            console.log("host room: " + clientRoom);
          } else {
            c.write("guest");
            console.log('--------------------------');
            console.log("guest came: " + clientName);
            console.log("guest room: " + clientRoom);
            console.log("room host: " + rooms[clientRoom].host);
            console.log("sending to host: " + "newGuest|"+clientName+"|"+c.remoteAddress.split(':')[3]);

            rooms[clientRoom].hostSocket.write("newGuest|"+clientName+"|"+c.remoteAddress.split(':')[3]);
            //TODO see how to close
            c.end();
          }
        break;
      default:

    }
    console.log("rooms: ");
    console.log(rooms);
	});
});

server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});









// const net = require('net');
// var history = [];
// var clients = [];
// const server = net.createServer((c) => {
// 	// Identify this client
//   c.name = c.remoteAddress.split(':')[3] + ":" + c.remotePort 	//remember the new client
// 	var i = clients.length;
// 	clients.push(c);
// 	//flush the history to the new client
// 	history.map(x => c.write(x + '\n'));
// 	//log and add to history
// 	recordAndBroadast(('client ' + c.name + ' connected!'), {}); //we want to broadcast to everyone including sender
//
//   c.on('end', () => {
// 		clients.splice(i, 1);
// 		recordAndBroadast(('client ' + c.name + ' disconnected!'), c);
//   });
//
// 	c.on('data', function(buf) {
// 		recordAndBroadast(buf, c);
// 	 });
// });
// server.on('error', (err) => {
//   throw err;
// });
// server.listen(8124, () => {
//   console.log('server bound');
// });
//
// var recordAndBroadast = function (message, sender) {
// 	clients.map(function(x) {
// 		// don't broadcast to the sender
// 		if (x != sender) {
// 			x.write(message);
// 		}
// 	});
// 	history.push(message);
// }
//
// var broadcast = function (message) {
// 	clients.map(x => x.write(message));
// }
