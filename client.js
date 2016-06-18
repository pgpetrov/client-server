"use strict";
var net = require('net');
var client = new net.Socket();
// var readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });


var myName = process.argv[2];
var roomName = process.argv[3];


var guests = [];
var history = {};
var isHost = false;

//connect to server
client.connect({port: 8124, host: '192.168.0.97'}, function() {
  console.log("connected to server");
  // Say we are new client. State name and room.
  console.log("sending: " + "new|" + myName + "|" + roomName);
  client.write("new|" + myName + "|" + roomName);

  client.on('data', function(data) {
    data = data.toString();
    console.log("data coming from server: " + data);
    var type = data.split('|')[0];
    switch (type) {
      case "host":
        // I am host.
        console.log('I am host');
        isHost = true;
        break;
      case "guest":
          console.log('I am guest, waiting for the host.');
          // I am guest. Waiting for the host to contact me.
          const clientServer = net.createServer((c) => {
            c.on('data', function(buf) {
              buf = buf.toString();
              var inputType = buf.split('|')[0];
              var inputData = buf.split('|')[1];
              console.log("host ccontacted and is sending " + inputType);
              console.log(inputData);
              switch (inputType) {
                case "history":
                  history = JSON.parse(inputData);
                  break;
                case "guests":
                  guests = connectToGuests(JSON.parse(inputData));
                  break;
                case "guest":
                  guests.push = connectToGuests([JSON.parse(inputData)])[0];
                  break;
                default:
              }
            });
          });
          clientServer.listen(8125, () => {
            console.log('guestServer bound');
          });

        break;
      case "newGuest":
        // new guest came and we are the host. connect and flush users and history.
        let guestName = data.split('|')[1];
        let guestHost = data.split('|')[2];
        console.log('new guest came we need to flush all to him');
        console.log('host: '+ guestHost);
        console.log('name: '+ guestName);

        let newClientSocket = new net.Socket();
        newClientSocket.connect({port: 8125, host: guestHost}, function() {
          newClientSocket.write("history|"+JSON.stringify(history));
          newClientSocket.write("guests|"+JSON.stringify(guests.map((x) => { return {
            guestHost : x.guestHost,
            name : x.guestName
          };})));
        });
        guests.push = {
          guestHost : guestHost,
          name : guestName,
          clientSocket : newClientSocket
        }

        break;
      default:
    }
  });

  // client.on('close', () => {console.log('closiiiiiing');})
  // client.on('end', () => {console.log('closiiiiiing');})

	// rl.on('line', (input) => {
	// 	client.write(myName + ": " + input);
	// });
});


var connectToGuests = function(gs) {
  return gs.map(function(x) {
    let xClient = new net.Socket();
    xClient.connect({port: 8125, host: x.guestHost}, function() {
    });
    x.clientSocket = xClient;
    return x;
  });
}





// var recordAndBroadast = function (message, sender) {
// 	clients.map(function(x) {
// 		// don't broadcast to the sender
// 		if (x != sender) {
// 			x.write(message);
// 		}
// 	});
// 	history.push(message);
// }























// var net = require('net');
//
// var client = new net.Socket();
//
// var readline = require('readline');
// var clientName = process.argv[2];
//
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
//
// client.connect({port: 8124, host: '127.0.0.1'}, function() {
// 	rl.on('line', (input) => {
// 		client.write(clientName + ": " + input);
// 	});
// });
//
// client.on('data', function(data) {
// 	console.log(data + "");
// });
//
// client.on('close', function() {
// 	console.log('Connection closed');
// });
