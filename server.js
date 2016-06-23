"use strict";
const net = require('net');
var rooms = {};
var clientToHost;
const server = net.createServer((c) => {
  c.on('data', function(buf) {
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
            //respond you are host now and send the your ip. will be needed later
            c.write(("host|"+guestIp), function() {c.destroy()});
            clientToHost = new net.Socket();
            clientToHost.connect({port: 8125, host: guestIp}, function() {
              console.log("connected to host");
              rooms[clientRoom] = {
                name : clientName,
                hostIp : guestIp,
                hostSocket : clientToHost,
                roomGuests : []
              };

              clientToHost.on("end", function() {
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
                    // client.on("data", handleHostLogic(client));
                  });
                  rooms[clientRoom].hostSocket=client;
                } else {
                  console.log("Destroying " + clientRoom + " as no one is left!");
                  // host left and no more guests. drop room.
                  rooms[clientRoom] = undefined;
                }
                //TODO handle host disconnect
              });
            })


          } else {
            //guest came for this room. Send him the host ip.
            rooms[clientRoom].roomGuests.push({
              name : clientName,
              guestIp : guestIp
            });
            // c.write("guest|"+rooms[clientRoom].hostIp + "|"+c.remoteAddress.split(':')[3], function() {c.destroy()});
            rooms[clientRoom].hostSocket.write("newGuest|" + guestIp);

          }
        break;
      default:
      console.log(buf);
    }
  });
});

server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});


// for (var room in rooms) {
//   rooms[room].hostSocket.on('end', () => {
//     console.log("OUCH host " + name + " for room " + room + "disconnected!");
//     // Handle hosts disconnect
//     rooms[room].name = rooms[room].roomGuests[0].name;
//     rooms[room].hostIp = rooms[room].roomGuests[0].guestIp;
//     rooms[room].roomGuests.splice(0,1);
//
//     var client = new net.Socket();
//
//     client.connect({port: 8124, host: rooms[room].hostIp}, function() {
//       // Tell first guest he is the Host now.
//       client.write("BECOMINGHOST|"+rooms[room].hostIp);
//       client.on("data", handleHostLogic(client));
//     });
//     rooms[room].hostSocket=client;
//   });
//
// }
