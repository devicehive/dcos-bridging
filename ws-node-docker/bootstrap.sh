#!/bin/bash -e

set -x

export CONSUL_HOST=consul.service.consul
export CONSUL_PORT=$(host -t SRV $CONSUL_HOST | cut -f 7 -d' ')
echo "consul configuration: $CONSUL_HOST:$CONSUL_PORT"

env

node /src/index.js

set +x
