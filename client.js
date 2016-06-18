"use strict";
var net = require('net');
var client = new net.Socket();

//
var readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var myName = process.argv[2];
var roomName = process.argv[3];


var guests = [];
var history = [];
var isHost = false;
var initialized = false;
var myIp;
//connect to server
client.connect({port: 8124, host: '192.168.0.97'}, function() {
  // Say we are new client. State name and room.
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
        myIp = data.split('|')[1];
        break;
      case "guest":
          console.log('I am guest, waiting for the host.');
          // I am guest. Waiting for the host to contact me.
          const clientServer = net.createServer((c) => {
            c.on('data', function(buf) {
              buf = buf.toString();
              var inputType = buf.split('||')[0];
              var historyData = buf.split('||')[1];
              var guestsData = buf.split('||')[2];
              if (!initialized && inputType == "historyGuests") {
                console.log("host ccontacted and is sending " + inputType);
                console.log(historyData);
                console.log(guestsData);
                history = JSON.parse(historyData);
                guests = connectToGuests(JSON.parse(guestsData));
                guests.map((x) => {
                  if (x.isHost) {
                    x.clientSocket = c;
                  }
                  return x;
                });
                initialized = true;
              } else {
                console.log(buf);
                history.push(buf);
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
        let guestIp = data.split('|')[2];

        let newClientSocket = new net.Socket();
        console.log("history");
        console.log(history);
        newClientSocket.connect({port: 8125, host: guestIp}, function() {
          var guestsToSend = guests.map((x) => { return {
            guestIp : x.guestIp,
            name : x.name,
            isHost : false
          };});
          guestsToSend.push({
            guestIp : myIp,
            name : myName,
            isHost : true
          });
          newClientSocket.write("historyGuests||"+JSON.stringify(history) + "||" + JSON.stringify(guestsToSend),
          function() {
            guests.push({
                    guestIp : guestIp,
                    name : guestName,
                    clientSocket : newClientSocket
                  });
          });
        });
        break;
      default:
    }
  });

  // client.on('close', () => {console.log('closiiiiiing');})
  // client.on('end', () => {console.log('closiiiiiing');})

});


var connectToGuests = function(gs) {
  return gs.map(function(x) {
    //do not connect to host he is allready connected to us.
    if (!x.isHost) {
      let xClient = new net.Socket();
      xClient.connect({port: 8125, host: x.guestIp}, function() {
        xClient.on('data', function(buf) {
          buf = buf.toString();
          console.log(buf);
          history.push(buf);
        });
      });
      x.clientSocket = xClient;
    }
    return x;
  });
}

rl.on('line', (input) => {
  history.push(myName + ": " + input);
  guests.map(x => x.clientSocket.write(myName + ": " + input));
});





















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
