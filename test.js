var topology = require('fully-connected-topology');
var net = require('net');

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

// var peers = [];
// var myIp = "123";
// var peersAndMe = peers.slice();
// peersAndMe.push(myIp+":8125");
// console.log(JSON.stringify(peersAndMe));



var t1 = topology('127.0.0.1:4001', ['127.0.0.1:4002']);
var t2 = topology('127.0.0.1:4002', []);

t1.on('connection', function(connection, peer) {
  console.log('t1 is connected to', peer);
  // connection.on("end", function(){
  //   console.log("ended " + peer);
  // })
  connection.write("boza");
  connection.on("data", function (data){
    console.log(data.toString());
  });

  // t2.destroy();
});

t2.on('connection', function(connection, peer) {
  console.log('t2 is connected to', peer);
  connection.on("data", function (data){
    console.log(data.toString());
  });
});



var client = new net.Socket();

client.connect({port: 4001, host: "127.0.0.1"}, function() {
  console.log("connected");
  // Tell first guest he is the Host now.
  client.write("BECOMINGHOST");
  client.on("data", function(data){
    console.log(data.toString());
  });
});




// t3.on('connection', function(connection, peer) {
//   console.log('t3 is connected to', peer);
// });
