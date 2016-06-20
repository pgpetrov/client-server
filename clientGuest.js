"use strict";
class clientHost {
    constructor (payload) {
      payload = payload || {};
      this.name = payload.name;
      this.ip = payload.ip;
      this.room = payload.room;

      this.history = payload.history || [];
      this.guests = payload.guests || [];
    }

    broadcast(message) {
      this.history.push(message);
      this.guests.map(x => x.socket.write(message));
    }

    listen() {
      const guestServer = net.createServer((c) => {
        c.on('data', function(buf) {
          buf = buf.toString();
          var inputType = buf.split('|')[0];
          if (!initialized && inputType == "historyGuests") {
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
            history.map((x) => {console.log(x); return x;});
          } else if(inputType == "BECOMINGHOST") {
            let commandComingFrom = c.remoteAddress.split(':')[3];
            if (commandComingFrom == serverIp) {
              isHost = true;
              myIp = buf.split('|')[1];
              // I am host.
              console.log("system> " + myName + ' is host');
              history.push("system> " + myName + ' is host');
            }
          } else if (isHost && inputType=="newGuest") {
            //we are the new host and we must take care of the new guests
            handleGuestLogic(buf);
          }else {
            console.log(buf);
            history.push(buf);
          }

          process.on('SIGINT', function() {
            console.log('sigint inside');
            c.end();
            client.end();
            process.exit();
          });


        });
      });
    }

    connectToGuests(gs) {
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

            xClient.on('close', () => {
                guests = guests.filter((y) => x.guestIp != y.guestIp);
            })


          });
          x.clientSocket = xClient;
        }
        return x;
      });
    }


}
