var scriptr_token = process.env.SCRIPTR_TOKEN;
var scriptr_chat = process.env.SCRIPTR_CHAT;
var streamapn_port = process.env.STREAMAPN_PORT;
var consul_host = process.env.CONSUL_HOST;
var consul_port = process.env.CONSUL_PORT;

var WebSocket = require('ws');
var zookeeper = require('node-zookeeper-client').createClient('master.mesos:2181');

var subscribeStr = "subscribe";
var unsubscribeStr = "unsubscribe";
var statsStr = "stats";
var trueStr = "true";
var falseStr = "false";
var date = new Date().toString();
var msgCount = 0;


zookeeper.once('connected', function() {
    var socket_client = new WebSocket("ws://socket.streamapn.com:" + streamapn_port);
    socket_client.on('open', function open() {
        var scriptr_client = new WebSocket("wss://api.scriptr.io/" + scriptr_token, null, {
            rejectUnauthorized: false
        });
        scriptr_client.on('open', function open() {
            try {
                zookeeper.create('/' + subscribeStr, function(error, path) {
                    if (error) {
                        console.log(error.stack);
                        return;
                    }
                });
                zookeeper.setData('/' + subscribeStr, new Buffer(falseStr), -1, function(error, stat) {
                    if (error) {
                        console.log(error.stack);
                        return;
                    }
                });
            } catch (err) {
                console.log(err);
            }
            scriptr_client.send(JSON.stringify({
                "method": "Subscribe",
                "params": {
                    "channel": scriptr_chat
                }
            }));

            function sendMsg(data) {
                var strMes = new Buffer(data).toString('ascii');
                var messageObject = {
                    "method": "Publish",
                    "params": {
                        "channel": scriptr_chat,
                        "message": strMes
                    }
                };
                scriptr_client.send(JSON.stringify(messageObject));
                ++msgCount;
            }

            socket_client.on('message', function(data, flags) {
                zookeeper.getData('/' + subscribeStr, null, function(err, datar, result) {

                    if (err) {
                        console.log('fwd ' + err.stack);
                        return;
                    }
                    console.log('stream apn ' + datar.toString('utf8') + ' == ' + trueStr);
                    if (datar.toString('utf8') == trueStr) sendMsg(data);
                });
            });

            scriptr_client.on('message', function(data, flags) {

                if (data.toLowerCase() == subscribeStr) {
                    zookeeper.setData('/' + subscribeStr, new Buffer(trueStr), -1, function(error, stat) {
                        if (error) {
                            console.log(error.stack);
                            return;
                        }
                    });
                }
                if (data.toLowerCase() == unsubscribeStr) {
                    zookeeper.setData('/' + subscribeStr, new Buffer(falseStr), -1, function(error, stat) {
                        if (error) {
                            console.log(error.stack);
                            return;
                        }
                    });
                }
                if (data.toLowerCase() == statsStr) {
                    var messageObject = {
                        "method": "Publish",
                        "params": {
                            "channel": scriptr_chat,
                            "message": JSON.stringify({
                                "startDate": date,
                                "msgCount": msgCount
                            })
                        }
                    };
                    scriptr_client.send(JSON.stringify(messageObject));
                }
            });
        });
    });

});

zookeeper.connect();