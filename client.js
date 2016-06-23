"use strict";

var readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var myName = process.argv[2];
var roomName = process.argv[3] || "room1";
var serverIp = process.argv[4] || "172.30.50.78"; //"192.168.0.97";//my home network ip
var peers = {};
var history = [];
var myIp;
var server;
var isHost;
var mainServerSocket;

var net = require('net');
var client = new net.Socket();
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
    console.log("set socket for ip " + comingIp);
    peers[comingIp] = {clientSocket : c};
  } else {
    console.log("set main server socket");
    mainServerSocket = c;
  }

  c.on('data', function(data){
    data = data.toString();
    var type = data.split('|')[0];
    switch (type) {
      case "newGuest":
        if (comingFromServer) {
          var guestIp = data.split('|')[1];
          var guestSocket = new net.Socket();
          guestSocket.connect({port: 8125, host: guestIp}, function() {
            //send all peers till now.
            guestSocket.write(("historyPeers|"+JSON.stringify(history) + "|" + JSON.stringify(Object.keys(peers))));
            // console.log(guestSocket);
            guestSocket.on("data", function(data){
              data = data.toString();
              console.log(data);
              history.push(data);
            });
            guestSocket.on("end", function(){
              delete peers[guestIp];
              console.log("system> "+guestIp+" disconnected");
              broadcast("system> "+guestIp+" disconnected");
              mainServerSocket.write("disconnected|" + guestIp);
            });
            peers[guestIp] = {clientSocket : guestSocket};
          });
        }
        break;
      case "historyPeers":
        populateAndPrintHistory(JSON.parse(data.split('|')[1]));
        populateAndConnectToAllPeers(JSON.parse(data.split('|')[2]));
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
    });
  } else {
    broadcast(myName + ": " + input);
  }
});


var broadcast = function (msg){
  history.push(msg);
  console.log(Object.keys(peers));
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
      s.on("end", function(){
        broadcast("system> "+x+" disconnected");
      });
    });
  });
}
