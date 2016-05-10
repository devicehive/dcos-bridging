
# Intro

DC/OS deployable bridge-adapters to various protocols / IoT data sources.

The following steps describe cluster creation and application deployment.

## Installation

Create Amazon EC2 Container Service registry, and publish docker images from the following directories there:
* ws-node-docker
* mqttclient

Start with deploying DC/OS to your Amazon account using cloudformation template. Please refer to the documentation on cluster settings.

Create tar.gz with .docker/config.json file and place it on Amazon S3, make it accessible to your cluster via direct http link.

## Application Deployment

Adjusted the following lines in mqttclient.json and ws-node-docker.json files:

    "uris": [
        "https://<the place where with docker config tar.gz file>"
    ]

You can deploy applications using dcos command line tools:

```dcos marathon add marathon/mosquitto.json```

```dcos marathon add marathon/mqttclient.json```

```dcos marathon add marathon/ws-node-docker.json```

