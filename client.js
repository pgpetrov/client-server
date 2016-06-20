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
var roomName = process.argv[3] || "room1";
var serverIp = process.argv[4] || "192.168.0.97"; //my home network ip

var guests = [];
var history = [];
var isHost = false;
var initialized = false;
var myIp;
//connect to server
client.connect({port: 8124, host: serverIp}, function() {
  // Say we are new client. State name and room.
  client.write("new|" + myName + "|" + roomName);

  client.on('data', function(data) {
    data = data.toString();
    var type = data.split('|')[0];
    switch (type) {
      case "host":
        // Server says I am host.
        console.log("system> " + myName + ' is host');
        history.push("system> " + myName + ' is host');
        isHost = true;
        myIp = data.split('|')[1];
        break;
      case "guest":
          console.log("I am guest. Ending socket.");
          client.end();
          client.destroy();
          console.log("I am guest. Ended");
          // Server says I am guest. Waiting for the host to contact me.
          myIp = data.split('|')[1];
          const clientServer = net.createServer((c) => {
            c.on('data', function(buf) {
              buf = buf.toString();
              var inputType = buf.split('|')[0];
              switch (inputType) {
                case "historyGuests":
                  if (!initialized) {
                    let historyData = buf.split('|')[1];
                    let guestsData = buf.split('|')[2];
                    history = JSON.parse(historyData);
                    guests = connectToGuests(JSON.parse(guestsData));
                    guests.map((x) => {
                      if (x.isHost) {
                        x.clientSocket = c;
                      }
                      return x;
                    });
                    initialized = true;
                    broadcastAndSave("system> " + myName + " connected");
                    history.map((x) => {console.log(x); return x;});
                  }
                  break;
                case "BECOMINGHOST":
                  let commandComingFromIp = c.remoteAddress.split(':')[3];
                  if (commandComingFromIp == serverIp) {
                    //Server connected and promoted me to host.
                    isHost = true;
                    console.log("system> " + myName + ' is host');
                    history.push("system> " + myName + ' is host');
                  }
                  break;
                case "newGuest":
                  //we are the new host and we must take care of the new guests
                  handleGuestLogic(buf);
                  break;
                default:
                  console.log(buf);
                  history.push(buf);
              }
            });

            c.on('end', function() {
              let endComingFromIp = c.remoteAddress.split(':')[3];
              let disconnectedName;
              guests = guests.filter((x) => {
                if (x.guestIp != endComingFromIp) {
                  return true;
                } else {
                  disconnectedName = x.name;
                  return false;
                }
                return x.guestIp != endComingFromIp;

              });
              console.log("system> " + disconnectedName + " disconnected");
              history.push("system> " + disconnectedName + " disconnected");

            });




          });
          clientServer.on('error', (err) => {
            throw err;
          });
          clientServer.listen(8125);
        break;
      case "newGuest":
        handleGuestLogic(data);
        break;
      default:
    }
  });

});


var connectToGuests = function(gs) {
  return gs.map(function(x) {
    // do not connect to host he is allready connected to us.
    if (!x.isHost) {
      let xClient = new net.Socket();
      // connect to client x
      xClient.connect({port: 8125, host: x.guestIp}, function() {
        // on data coming from client x write in history and flush
        xClient.on('data', function(buf) {
          buf = buf.toString();
          console.log(buf);
          history.push(buf);
        });

        // on end coming from client x remove object from guests.
        xClient.on('end', () => {
            guests = guests.filter((y) => {
              return x.guestIp != y.guestIp;
            });
            console.log("system> " + x.name + " disconnected");
            history.push("system> " + x.name + " disconnected");
        })
        x.clientSocket = xClient;
      });
    }
    return x;
  });
}

rl.on('line', (input) => {
  if (input == "exit") {
    guests.map(x => x.clientSocket.end());
    setImmediate(process.exit());
  } else {
    history.push(myName + ": " + input);
    guests.map(x => x.clientSocket.write(myName + ": " + input));
  }
});

// send message to all guests and save it to local history
var broadcastAndSave = function (message) {
  history.push(message);
  guests.map(x => x.clientSocket.write(message));
}



var handleGuestLogic = function (data) {
  // new guest came and we are the host. connect and flush users and history.
  let guestName = data.split('|')[1];
  let guestIp = data.split('|')[2];

  let newClientSocket = new net.Socket();

  newClientSocket.connect({port: 8125, host: guestIp}, function() {
    //if we are getting from him this is just chat.
    newClientSocket.on('data',  function(buf) {
      buf = buf.toString();
      console.log(buf);
      history.push(buf);
    });
    //send guests name and ip only. Client will create connection socket himself.
    var guestsToSend = guests.map((x) => { return {
      guestIp : x.guestIp,
      name : x.name,
      isHost : false
    };});
    //send self(host)
    guestsToSend.push({
      guestIp : myIp,
      name : myName,
      isHost : true
    });

    // On that guest FIN package remove him from guests array and broadcast he disconnected.
    newClientSocket.on('end', () => {
        guests = guests.filter((x) => x.guestIp != guestIp);
        console.log("system> " + guestName + " disconnected!");
        history.push("system> " + guestName + " disconnected!");
        // broadcastAndSave("system> " + guestName + " disconnected!");
    })
    // flush history and guests and then save him to guests
    newClientSocket.write("historyGuests|"+JSON.stringify(history) + "|" + JSON.stringify(guestsToSend),
    function() {
      //after new guest has history and other guestst record him also
      guests.push({
              guestIp : guestIp,
              name : guestName,
              clientSocket : newClientSocket
            });
    });

  });
}

//attempt to handle of CTRL-C exit. Send FIN request to all Behaves differently on windows and mac :(
// process.on('SIGINT', function() {
//   console.log('sigint outside');
//   client.end();
//   guests.map(x => x.clientSocket.end());
//   process.exit();
// });












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
