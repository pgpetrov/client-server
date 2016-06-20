"use strict";

var topology = require('fully-connected-topology');
var net = require('net');
var clientSocket = new net.Socket();

var myName = process.argv[2];
var roomName = process.argv[3] || "room1";
var serverIp = process.argv[4] || "192.168.0.97"; //my home network ip
var myIp;
var myTopology;
var history = [];
var isHost = false;
clientSocket.connect({port: 8124, host: serverIp}, function() {
    // Say we are new client. State name and room.
    clientSocket.write("new|" + myName + "|" + roomName);
    clientSocket.on('data', function(data) {
      data = data.toString();
      var type = data.split('|')[0];
      switch (type) {
        case "host":
          // I am host.
          console.log("system> " + myName + ' is host');
          history.push("system> " + myName + ' is host');
          isHost = true;
          myIp = data.split('|')[1];
          myTopology = topology(myIp+":8125", []);
          myTopology.on("connection", function(s) {
            s.write("hello new guest. I am the host");
          });
        break;
        case "guest":
          myIp = data.split('|')[1];
          myTopology = topology(myIp+":8125", []);
          myTopology.on("connection", function(s) {
            s.on("data", function (data) {
              data = data.toString();
              console.log(data);
            });
          });
          clientSocket.end();
        break;
        case "newGuest":
          //we are host, new guest came
          let guestIp = data.split('|')[2];
          myTopology.add(guestIp+":8125");
        break;
        default:
      }
    });
});


//
//
// var net = require('net');
// var client = new net.Socket();
//
// //
// var readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
//
//
// var myName = process.argv[2];
// var roomName = process.argv[3] || "room1";
// var serverIp = process.argv[4] || "192.168.0.97"; //my home network ip
//
// var guests = [];
// var history = [];
// var isHost = false;
// var initialized = false;
// var myIp;
// //connect to server
// client.connect({port: 8124, host: serverIp}, function() {
//   // Say we are new client. State name and room.
//   client.write("new|" + myName + "|" + roomName);
//
//   client.on('data', function(data) {
//     data = data.toString();
//     var type = data.split('|')[0];
//     switch (type) {
//       case "host":
//         // I am host.
//         console.log("system> " + myName + ' is host');
//         history.push("system> " + myName + ' is host');
//         isHost = true;
//         myIp = data.split('|')[1];
//         break;
//       case "guest":
//           // I am guest. Waiting for the host to contact me.
//           const clientServer = net.createServer((c) => {
//             c.on('data', function(buf) {
//               buf = buf.toString();
//               var inputType = buf.split('|')[0];
//               if (!initialized && inputType == "historyGuests") {
//                 let historyData = buf.split('|')[1];
//                 let guestsData = buf.split('|')[2];
//                 history = JSON.parse(historyData);
//                 guests = connectToGuests(JSON.parse(guestsData));
//                 guests.map((x) => {
//                   if (x.isHost) {
//                     x.clientSocket = c;
//                   }
//                   return x;
//                 });
//                 initialized = true;
//                 history.map((x) => {console.log(x); return x;});
//               } else if(inputType == "BECOMINGHOST") {
//                 let commandComingFrom = c.remoteAddress.split(':')[3];
//                 if (commandComingFrom == serverIp) {
//                   isHost = true;
//                   myIp = buf.split('|')[1];
//                   // I am host.
//                   console.log("system> " + myName + ' is host');
//                   history.push("system> " + myName + ' is host');
//                 }
//               } else if (isHost && inputType=="newGuest") {
//                 //we are the new host and we must take care of the new guests
//                 handleGuestLogic(buf);
//               }else {
//                 console.log(buf);
//                 history.push(buf);
//               }
//
//               process.on('SIGINT', function() {
//                 console.log('sigint inside');
//                 c.end();
//                 client.end();
//                 process.exit();
//               });
//
//
//             });
//           });
//
//           clientServer.on('error', (err) => {
//             throw err;
//           });
//
//           clientServer.listen(8125, () => {
//             // console.log('guestServer bound');
//           });
//
//         break;
//       case "newGuest":
//         handleGuestLogic(data);
//         break;
//       default:
//     }
//   });
//
// });
//
//
// var connectToGuests = function(gs) {
//   return gs.map(function(x) {
//     //do not connect to host he is allready connected to us.
//     if (!x.isHost) {
//       let xClient = new net.Socket();
//       xClient.connect({port: 8125, host: x.guestIp}, function() {
//         xClient.on('data', function(buf) {
//           buf = buf.toString();
//           console.log(buf);
//           history.push(buf);
//         });
//
//         xClient.on('close', () => {
//             guests = guests.filter((y) => x.guestIp != y.guestIp);
//         })
//
//
//       });
//       x.clientSocket = xClient;
//     }
//     return x;
//   });
// }
//
// rl.on('line', (input) => {
//   history.push(myName + ": " + input);
//   guests.map(x => x.clientSocket.write(myName + ": " + input));
// });
//
// var broadcastAndSave = function (message) {
//   history.push(message);
//   guests.map(x => x.clientSocket.write(message));
// }
//
//
//
// var handleGuestLogic = function (data) {
//   // new guest came and we are the host. connect and flush users and history.
//   let guestName = data.split('|')[1];
//   let guestIp = data.split('|')[2];
//
//   let newClientSocket = new net.Socket();
//
//   newClientSocket.connect({port: 8125, host: guestIp}, function() {
//     newClientSocket.on('data',  function(buf) {
//       buf = buf.toString();
//       console.log(buf);
//       history.push(buf);
//     });
//     //send guests name and ip only. Client will create connection socket himself.
//     var guestsToSend = guests.map((x) => { return {
//       guestIp : x.guestIp,
//       name : x.name,
//       isHost : false
//     };});
//     //send self(host)
//     guestsToSend.push({
//       guestIp : myIp,
//       name : myName,
//       isHost : true
//     });
//
//     newClientSocket.on('close', () => {
//         console.log("clientSOCKET closed");
//         broadcastAndSave("system> " + guestName + " disconnected!");
//         guests = guests.filter((x) => x.guestIp != guestIp);
//     })
//
//     newClientSocket.write("historyGuests|"+JSON.stringify(history) + "|" + JSON.stringify(guestsToSend),
//     function() {
//       //after new guest has history and other guestst record him also
//       guests.push({
//               guestIp : guestIp,
//               name : guestName,
//               clientSocket : newClientSocket
//             });
//     });
//
//   });
// }
//
//
// process.on('SIGINT', function() {
//   console.log('sigint outside');
//   client.end();
//   process.exit();
// });
