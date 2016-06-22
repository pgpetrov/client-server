"use strict";
var zmq = require('zmq')
  , topology = require('fully-connected-topology')
  , net = require('net')
  , readline = require('readline');
var port = 'tcp://127.0.0.1:8125';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var myName = process.argv[2];
  , roomName = process.argv[3] || "room1"
  , serverIp = process.argv[4] || "192.168.0.97" //my home network ip
  , history = []
  , peers = []
  , isHost = false
  , myIp
  , myTopology;


var clientSocket = new net.Socket();

var socketSub = zmq.socket('pub');
var socketPub = zmq.socket('pub');

var channels = ['DATA', 'CHAT'];

clientSocket.connect({port: 8124, host: serverIp}, function() {
    // Say we are new client. State name and room.
    clientSocket.write("new|" + myName + "|" + roomName);
    clientSocket.on('data', function(data) {
      data = data.toString();
      var type = data.split('|')[0];
      switch (type) {
        case "host":
        break;
        case "guest":
        break;
        default:
      }
    });
});
