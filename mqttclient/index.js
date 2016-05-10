var mqtt = require('mqtt');
var WebSocket = require('ws');

var mqqt_host = process.env.MOSQUITTO_MQTT_ADDRESS
var mqtt_port = process.env.MOSQUITTO_MQTT_PORT
var mqtt_topic = process.env.MOSQUITTO_MQTT_TOPIC
var scriptr_token = process.env.SCRIPTR_TOKEN
var scriptr_chat = process.env.SCRIPTR_CHAT

var scriptr_client = new WebSocket("wss://api.scriptr.io/" + scriptr_token, null, {
    rejectUnauthorized: false
});

scriptr_client.on('open', function open() {
    var mqtt_client = mqtt.connect('mqtt://' + mqqt_host + ':' + mqtt_port);
    console.log('connected');

    mqtt_client.on('connect', function() {
        mqtt_client.subscribe(mqtt_topic);
        console.log("mqtt connected")
    });

    mqtt_client.on('message', function(topic, message) {
        var strMes = new Buffer(message).toString('ascii');
        var chatMessageObject = {
            "method": "Publish", //using the publish method, the "message" will just be pushed to anyone listening to "chat"
            "id": "publish", //will be returned as part of the generated id, in order to identify the response
            "params": {
                "channel": scriptr_chat,
                "message": strMes
            }
        }

        console.log(JSON.stringify(chatMessageObject))
        scriptr_client.send(JSON.stringify(chatMessageObject));
    });
});
