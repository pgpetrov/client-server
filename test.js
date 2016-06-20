var topology = require('fully-connected-topology');

// var swarm = ["127.0.0.1:4000", "127.0.0.1:4001", "127.0.0.1:4002"];
//
// topologySwarm = swarm.map((x, i) => {
//   let work = swarm.slice();
//   work.splice(i,1);
//   return topology(x, work);
// });
//
// topologySwarm.map((x, i) => {x.on("connection", function(connection, peer) {
//   console.log(i + ' is connected to', peer);
// })});
// t1.on('connection', function(connection, peer) {
//   console.log('t1 is connected to', peer);
// });


// var t1 = topology('127.0.0.1:4001', ['127.0.0.1:4002', '127.0.0.1:4003']);
// var t2 = topology('127.0.0.1:4002', ['127.0.0.1:4001', '127.0.0.1:4003']);
// var t3 = topology('127.0.0.1:4003', ['127.0.0.1:4001', '127.0.0.1:4002']);

var peers = [];
var myIp = "123";
var peersAndMe = peers.slice();
peersAndMe.push(myIp+":8125");
console.log(JSON.stringify(peersAndMe));



var t1 = topology('127.0.0.1:4001', []);
var t2 = topology('127.0.0.1:4002', []);

t1.on('connection', function(connection, peer) {
  console.log('t1 is connected to', peer);
});

t2.on('connection', function(connection, peer) {
  console.log('t2 is connected to', peer);
});

t1.add('127.0.0.1:4002');
t2.add('127.0.0.1:4001');

// t3.on('connection', function(connection, peer) {
//   console.log('t3 is connected to', peer);
// });
