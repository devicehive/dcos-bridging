
# Intro

DC/OS deployable bridge-adapters to various protocols / IoT data sources.

The following steps describe cluster creation and application deployment.

## Pre-requisites

Deployed DC/OS cluster required to run bridges. You can follow instructions available on DC/OS web site to create environment.
There are several options available like AWS, Google Cloud. Simplest in our case is using [AWS CloudFormation template](https://docs.mesosphere.com/1.7/administration/installing/cloud/aws/).
Once managed environment is ready, you might want to open Web UI and check status of your stack.

You will need DC/OS command line tools to smiplify the process. In order to install and authenticate them please follow the [installation](https://dcos.io/docs/1.7/usage/cli/install/) and [configuration](https://dcos.io/docs/1.7/usage/cli/configure/) instructions.

## Prepare private bridge docker image

This section describes additional information on storing private docker images.
Private docker images could be used in cases when business logic is being stored in it.

The most convenient way in case of amazon deployment is utilising Amazon EC2 Container Service registry. To create it, you need to follow the next steps:
 * Login to your AWS account;
 * Under Compute umbrella select EC2 Container Services item, or follow the [link](https://console.aws.amazon.com/ecs/);
 * Click on Get Started button, and on the first page untick the box “Deploy a sample application onto an Amazon ECS Cluster”, and click on continue button;
 * Choose repository name, and fill in form on the page, then click on “Next step” button;

After repository created you should see the web page with instructions describing how to deploy a docker image to your own repository. Let’s briefly describe how to deploy one of our docker images.
 * Start t2.large EC2 instance, with Amazon Linux OS;
 * SSH into machine;
 * Install prerequisites: ```sudo yum install git docker```, and start docker service ```sudo service docker start```
 * Install aws cli: ```sudo pip install awscli --ignore-installed six```;
 * Configure environment:
 ** Create IAM role and generate credentials (it will be used on the next step);
 ** Configure aws cli: ```aws configure```;
 ** Perform ECR login ```aws ecr get-login --region us-east-1```;
 ** And run the command printed on the command line;
 * Download the source code from github using clone command and navigate to docker image directory;
 * Build and publish docker image, run next commands (*):
 ** ```docker build -t my_docker_image_name .```
 ** ```docker tag my_docker_image_name:latest 203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest```
 ** ```docker push 203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest```
 * Now navigate to your ECR and check that image is there.
(*) Please note that provided commands are specific to my account, and you need to adjust them accordingly. To find repository url you can open ECR web page, click on repository, find button with text “View Push Commands” and click on it.


## Deploy bridge

Once environment is ready, docker images are uploaded into private registry, you can deploy bridge into the DC/OS stack.
Marathon is responsible for handling that tasks for us. In order to provide information about your image you need to create marathon service description file.
There are several examples of service description files under the marathon directory.

### Amazon EC2 Container Service Auth

To work with Amazon EC2 Container Services you need to obtain docker authentication information.
When using alternative docker registry steps might differ. Follow the instructions below to create docker auth file:

SSH into EC2 machine, or run from local machine with installed aws cli and docker.
  ```aws ecr get-login --region us-east-1```
This will print docker registration command. Copy it and run from the shell.
Now it's time to create docker.tar.gz file, go to user home directory and run:
  ```tar czf docker.tar.gz .docker```

Create S3 bucket and upload file there. Configure file permissions to be available for your DC/OS stack.
Please refer to Amazon S3 [documentation](http://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies-vpc-endpoint.html)

Get the url for the docker.tar.gz file in S3 bucket (right click on file in S3 UI and select properties, it will open panel where you can find http link).

### Start the bridge in DC/OS

Update your marathon files with your details. The very first thinhg you might need to update is image docker registry.
You can navigate to Amazon EC2 Container Services and get repository name from there and extend it with image name.
Find the line 

    ```"image": "docker-registry.service.consul:5000/",```

and replace for example with (please note that url will be different for you):

    ```"image": "203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest",```

Now you need to find the next lines

```
    "uris": [
        "https://<the place where with docker config tar.gz file>"
    ]
```

and replace it with the link to your docker.tar.gz file stored on S3:

```
    "uris": [
        "https://https://s3.amazonaws.com/mybucket/myconf.tar.gz"
    ]
```

You can deploy applications using dcos command line tools:

```dcos marathon add marathon/mosquitto.json```

```dcos marathon add marathon/mqttclient.json```

```dcos marathon add marathon/ws-node-docker.json```

### Install Load Balancer

To make mosquitto mqtt broker accessible from the internet you also need to deploy marathon load balancer:

```dcos package install marathon-lb```

More details could be found at https://mesosphere.com/blog/2015/12/04/dcos-marathon-lb/.
