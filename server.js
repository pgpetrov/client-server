"use strict";
const net = require('net');
var rooms = {};
const server = net.createServer((c) => {
  c.on('data', handleHostLogic(c));
  c.on('end', handleHostDisconnectLogic);
});



server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});


var handleHostLogic = function(c) {
  return function (buf) {
    buf = buf.toString();
    console.log("server incoming -> " + buf);
    var type = buf.split('|')[0];
    //type|name|clientRoom
    switch (type) {
      case "new":
          let clientName = buf.split('|')[1];
          let clientRoom = buf.split('|')[2];
          let guestIp = c.remoteAddress.split(':')[3];
          if (!rooms[clientRoom]) {
            rooms[clientRoom] = {
              name : clientName,
              hostIp : guestIp,
              hostSocket : c,
              roomGuests : []
            };
            //respond you are host now and send the your ip. will be needed later
            c.write("host|"+guestIp);
          } else {
            //guest came for this room
            c.write(("guest|"+guestIp), undefined, function() {
            rooms[clientRoom].hostSocket.write("newGuest|"+clientName+"|"+guestIp)});
            rooms[clientRoom].roomGuests.push({
              name : clientName,
              guestIp : guestIp
            });
          }
        break;
      case "disconnected":
        let peerIpPort = buf.split('|')[1];
        let clientRoom = buf.split('|')[2];
        var peerIndex;
        rooms[clientRoom].roomGuests.every(function(x,i){
          if (x.guestIp == peerIpPort.split(":")[0]) {
            peerIndex = i;
            //break
            return false;
          } else {
            return true;
          }
        });
        if (peerIndex) rooms[clientRoom].roomGuests.splice(i , 1);
      default:

    }
  }
};


var handleHostDisconnectLogic = function()  {

  console.log("OUCH host " + clientName + " for room " + clientRoom + " disconnected!");
  console.log(rooms[clientRoom].roomGuests);
  // Handle hosts disconnect
  if (rooms[clientRoom].roomGuests.length > 0) {
    rooms[clientRoom].name = rooms[clientRoom].roomGuests[0].name;
    rooms[clientRoom].hostIp = rooms[clientRoom].roomGuests[0].guestIp;
    rooms[clientRoom].roomGuests.splice(0,1);
    console.log( rooms[clientRoom].name + " promoted to host for room " + clientRoom + "!");

    var client = new net.Socket();

    client.connect({port: 8125, host: rooms[clientRoom].hostIp}, function() {
      // Tell first guest he is the Host now.
      client.write("BECOMINGHOST|"+rooms[clientRoom].hostIp);
      client.on("data", handleHostLogic(client));
    });
    rooms[clientRoom].hostSocket=client;
  } else {
    console.log("Destroying " + clientRoom + " as no one is left!");
    // host left and no more guests. drop room.
    rooms[clientRoom] = undefined;
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
