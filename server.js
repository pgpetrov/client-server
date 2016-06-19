"use strict";
const net = require('net');
var rooms = {};
const server = net.createServer((c) => {
  c.on('data', handleHostLogic(c));
});



for (var room in rooms) {
  rooms[room].hostSocket.on('end', () => {
    // Handle hosts disconnect
    rooms[room].hostName = rooms[room].roomGusets[0].guestName;
    rooms[room].hostIp = rooms[room].roomGusets[0].guestIp;
    rooms[room].roomGusets.splice(0,1);

    var client = new net.Socket();

    client.connect({port: 8124, host: rooms[room].hostIp}, function() {
      // Tell first guest he is the Host now.
      client.write("BECOMINGHOST|"+rooms[room].hostIp);
      client.on("data", handleHostLogic(client));
    });



    rooms[room].hostSocket=client;


  });

}


server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});


var handleHostLogic = function(c) {
  return function (buf) {
    buf = buf.toString();
    var type = buf.split('|')[0];
    //type|name|clientRoom
    switch (type) {
      case "new":
          let clientName = buf.split('|')[1];
          let clientRoom = buf.split('|')[2];
          let guestIp = c.remoteAddress.split(':')[3];
          if (!rooms[clientRoom]) {
            rooms[clientRoom] = {
              hostName : clientName,
              hostIp : guestIp,
              hostSocket : c,
              roomGusets : []
            };
            //respond you are host now and send the your ip. will be needed later
            c.write("host|"+guestIp);
          } else {
            c.write("guest");
            rooms[clientRoom].hostSocket.write("newGuest|"+clientName+"|"+guestIp);
            rooms[clientRoom].roomGusets.push[{
              guestName : clientName,
              guestIp : guestIp
            }];
            c.end();
          }
        break;
      default:

    }
  }
};







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
