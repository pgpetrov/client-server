"use strict";

var readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var myName = process.argv[2]
  , roomName = process.argv[3] || "room1"
  , serverIp = process.argv[4] || "172.30.50.78" //"192.168.0.97"//my home network ip
  , peers = {}
  , history = []
  , myIp
  , server
  , isHost
  , mainServerSocket;

var net = require('net')
  , client = new net.Socket();
//connect to server
client.connect({port: 8124, host: serverIp}, function() {
  // Say we are new client. State name and room.
  client.write("new|" + myName + "|" + roomName);
  // get response from the server.
  client.on('data', function(data) {
    data = data.toString();
    var type = data.split('|')[0];
    myIp = data.split('|')[1];
    switch (type) {
      case "host":
        console.log("system> " + myName + " is host");
        broadcast("system> " + myName + " is host");
        break;
      case "guest":
        //just save the hostip among the peers
        peers[data.split('|')[2]] = {};
        //we do nothing here. Server will notify the host about us.
        break;
      default:
    }
    client.end();
    client.destroy();
  });
});


server = net.createServer((c) => {
  let comingIp = c.remoteAddress.split(':')[3];
  var comingFromServer = comingIp == serverIp;
  if(!comingFromServer) {
    // we have new connection not coming from the server. Record it.
    peers[comingIp] = {clientSocket : c};
  } else {
    // We will need this if we are host.
    mainServerSocket = c;
  }

  c.on('data', function(data){
    data = data.toString();
    var type = data.split('|')[0];
    switch (type) {
      case "newGuest":
        if (comingFromServer) {
          var newGuestIp = data.split('|')[1];
          var guestSocket = new net.Socket();
          guestSocket.connect({port: 8125, host: newGuestIp}, function() {
            console.log("system> "+newGuestIp+" connected");
            broadcast("system> "+newGuestIp+" connected");

            //send all peers till now.
            guestSocket.write(("historyPeers|"+JSON.stringify(history) + "|" + JSON.stringify(Object.keys(peers))));
            guestSocket.on("data", function(data){
              data = data.toString();
              console.log(data);
              history.push(data);
            });
            guestSocket.on("end", function(){
              delete peers[newGuestIp];
              console.log("system> "+newGuestIp+" disconnected");
              history.push("system> "+newGuestIp+" disconnected");
              // broadcast("system> "+newGuestIp+" disconnected");
              mainServerSocket.write("disconnected|" + newGuestIp);
            });
            peers[newGuestIp] = {clientSocket : guestSocket};
          });
        }
        break;
      case "historyPeers":
        populateAndPrintHistory(JSON.parse(data.split('|')[1]));
        populateAndConnectToAllPeers(JSON.parse(data.split('|')[2]));
        break;
      case "BECOMINGHOST":
        if (comingFromServer) {
          isHost = true;
          console.log("system> "+myName+" is host");
          broadcast("system> "+myName+" is host");
        }
        break;
      default:
        console.log(data);
        history.push(data);
    }
  });

  c.on("end", function(){
    delete peers[comingIp];

    // console.log("system> "+guestIp+" disconnected");
    // broadcast("system> "+guestIp+" disconnected");
  });
});

server.listen(8125, () => {
  console.log('server bound');
});

server.on('error', (err) => {
  throw err;
});


rl.on('line', (input) => {
  if (input == "exit") {
    server.close();
    Object.keys(peers).forEach(function(key, idx) {
      peers[key].clientSocket.end();
      process.exit();
    });
  } else {
    broadcast(myName + ": " + input);
  }
});


var broadcast = function (msg){
  history.push(msg);
  Object.keys(peers).forEach(function(key, idx) {
    peers[key].clientSocket.write(msg);
  });
}

var populateAndPrintHistory = function(h){
    history = h;
    history.forEach((x) => {console.log(x)});
}

var populateAndConnectToAllPeers = function(ipArray, comingIp, c) {
  ipArray.forEach(function(x) {
    peers[x] = {};
  });
  Object.keys(peers).forEach(function(x) {
    let s = new net.Socket();
    s.connect({port: 8125, host: x}, function() {
      peers[x].clientSocket = s;
      s.on("data", function(data){
        data = data.toString();
        console.log(data);
        history.push(data);
      });
      s.on("end", function(){
        delete peers[x];
        console.log("system> "+x+" disconnected");
        history.push("system> "+x+" disconnected");
        //TODO that is bad
        // broadcast("system> "+x+" disconnected");
      });
    });
  });
}
