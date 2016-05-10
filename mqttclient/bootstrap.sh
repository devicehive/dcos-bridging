#!/bin/bash -e

set -x

export MOSQUITTO_MQTT_ADDRESS=mosquitto.marathon.mesos
export MOSQUITTO_MQTT_PORT=$(host -t SRV _mosquitto._tcp.marathon.mesos | sort | head -1 | cut -f 7 -d' ')
echo "mosquitto mqtt configuration: $MOSQUITTO_MQTT_ADDRESS:$MOSQUITTO_MQTT_PORT"

env

node /src/index.js

set +x
