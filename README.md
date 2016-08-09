
# Intro

DC/OS deployable bridge-adapters to various protocols / IoT data sources.

The following steps describe cluster creation and application deployment.

## Pre-requisites

A deployed DC/OS cluster required to run bridges. You can follow the instructions available on the DC/OS web site to create an environment.
There are several options (like AWS, Google Cloud) available. The simplest one in our case is using the [AWS CloudFormation template](https://docs.mesosphere.com/1.7/administration/installing/cloud/aws/).
Once the managed environment is ready, you might want to open the Web UI and check the status of your stack.

You will need the DC/OS command line tools to smiplify the process. In order to install and authenticate them please follow the [installation](https://dcos.io/docs/1.7/usage/cli/install/) and [configuration](https://dcos.io/docs/1.7/usage/cli/configure/) instructions.

## Prepare private bridge docker image

This section describes additional information about storing private docker images.
Private docker images could be used in cases when the business logic is being stored in it.

The most convenient way in case of amazon deployment is utilising the Amazon EC2 Container Service registry. To create it, you need to follow the next steps:
 * Login to your AWS account;
 * Under Compute umbrella select a EC2 Container Services item, or follow the [link](https://console.aws.amazon.com/ecs/);
 * Click on the Get Started button, and on the first page untick the box “Deploy a sample application onto an Amazon ECS Cluster”, and click on the continue button;
 * Choose the repository name, and fill in the form on the page, then click on the “Next step” button;

After the repository is created you should see the web page with instructions describing how to deploy a docker image to your own repository. Let’s briefly describe how to deploy one of our docker images.
 * Start the t2.large EC2 instance with Amazon Linux OS;
 * SSH into machine;
 * Install prerequisites: ```sudo yum install git docker```, and start docker service ```sudo service docker start```
 * Install aws cli: ```sudo pip install awscli --ignore-installed six```;
 * Configure the environment:

  * Create IAM role and generate credentials (it will be used on the next step);
  * Configure aws cli: ```aws configure```;
  * Perform ECR login ```aws ecr get-login --region us-east-1```;
  * And run the command printed on the command line;
 
 * Download the source code from github using the clone command and navigate to the docker image directory;
 * Build and publish the docker image, run the next commands (*):

  * ```docker build -t my_docker_image_name .```
  * ```docker tag my_docker_image_name:latest 203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest```
  * ```docker push 203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest```

 * Now navigate to your ECR and check that the image is there.
(*) Please note that provided commands are specific to my account, and you need to adjust them accordingly. To find the repository url you can open the ECR web page, click on the repository, find the button with the text “View Push Commands” and click it.


## Deploy bridge

Once the environment is ready, the docker images are uploaded into private registry, you can deploy a bridge into the DC/OS stack.
Marathon is responsible for handling these tasks for us. In order to provide information about your image you need to create a marathon service description file.
There are several examples of service description files in the marathon directory.

### Amazon EC2 Container Service Auth

To work with Amazon EC2 Container Services you need to obtain docker authentication information.
Steps might differ if you use an alternative docker registry . Follow the instructions below to create the docker auth file:

SSH to the EC2 machine, or run from the local machine with installed aws cli and docker.
  ```aws ecr get-login --region us-east-1```
This will print the docker registration command. Copy it and run from the shell.
Now it's time to create the docker.tar.gz file, go to the user home directory and run:
  ```tar czf docker.tar.gz .docker```

Create an S3 bucket and upload the file there. Configure the file permissions to be accessible by your DC/OS stack.
Please refer to the Amazon S3 [documentation](http://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies-vpc-endpoint.html)

Get the url for the docker.tar.gz file in the S3 bucket (right click on the file in the S3 UI and select its properties, it will open the panel where you can find the http link).

### Start the bridge in DC/OS

Update your marathon files with your details. The very first thing you might need to update is the image docker registry.
You can navigate to Amazon EC2 Container Services and get the repository name from there and extend it with the image name.
Find the line 

    ```"image": "docker-registry.service.consul:5000/",```

and replace it with the example  (please note that url will be different for you):

    ```"image": "203515518953.dkr.ecr.us-east-1.amazonaws.com/my_docker_image_name:latest",```

Now you need to find the next lines

```
    "uris": [
        "https://<the place where with docker config tar.gz file>"
    ]
```

and replace them with the link to your docker.tar.gz file stored on S3:

```
    "uris": [
        "https://https://s3.amazonaws.com/mybucket/myconf.tar.gz"
    ]
```

You can deploy applications using the dcos command line tools:

```dcos marathon add marathon/mosquitto.json```

```dcos marathon add marathon/mqttclient.json```

```dcos marathon add marathon/ws-node-docker.json```

### Install Load Balancer

To make the mosquitto mqtt broker accessible from the internet you also need to deploy the marathon load balancer:

```dcos package install marathon-lb```

More details can be found at https://mesosphere.com/blog/2015/12/04/dcos-marathon-lb/.
