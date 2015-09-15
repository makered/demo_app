# Demo App

An Express 4 boilerplate app that serves as a POC of a deployment process to AWS that utilizes [CircleCI](https://circleci.com/), [Packer](https://packer.io/), and [Ansible](http://www.ansible.com/)

## Description

TODO

## Setup

1. The deploy script assumes a specific naming format for application's AWS resources (Auto-Scaling Group, Launch Configuration, AMI name, Key Pair name, ELB, Security Group, IAM Role):

  ```
  Auto-Scaling Group:     <app name>-<environment>
  Launch Configuration:   <app name>-<environment>@<app version>
  AMI Name:               <app name>@<app version>
  Key Pair:               <app name>
  ELB:                    <app name>-<environment>             (non-alpha-num chars removed)
  Security Group:         <APP NAME>_<ENVIRONMENT>
  IAM role:               <app name>_<environment>
  
  <app name>              application name (e.g. demo_app)
  <app version>           application version (e.g. 0.1.2)
  <environment>           deployment environment (e.g. develop, stage, production)
  ```
The purpose behind this scheme is to simplify setup, avoid explicit configuration, and encourage a clear and   predictable naming convention.
2. Modify (and if necessary, rename) `deploy/packer/vars/aws_oregon.json` with settings that reflect your AWS environment. These settings tell Packer where/how the **amazon-ebs** builder will spin up a temporarity EC2 instance used for provisioning and artifact AMI creation.
3. If deploying with CircleCI (optional): 
  1. Add a **demo_app** project to CircleCI and set up the following environment variables:
    * **AWS_REGION**           - example: us-west-2
    * **CIRCLE_TOKEN**         - CircleCI API token needed by the `do-exclusively.sh` script
    * **INSTANCE_TYPE_DEV**    - desired EC2 instance type for the dev environment
    * **INSTANCE_TYPE_STAGE**  - desired EC2 instance type for the stage environment
    * **INSTANCE_TYPE_PROD**   - desired EC2 instance type for the prod environment
    * **SOURCE_AMI**           - source AMI for Packer to use for the temporary EC2 instance. This allows for common configuration steps (e.g. OS patching, centralized logging setup) to be performed one time and "baked" into a custom source AMI that is inherited by the final AMI artifact, saving time during the build process and preventing duplication
  2. In project settings, **AWS Permissions** section, add an AWS key pair of an IAM user (create a dedicated user) with a policy allowing sufficient rights for Packer and deployment script to access AWS from a Circle container. For policy reference see:
    * `deploy\aws\packer.txt`
    * `deploy\aws\deploy.txt`
4. (optional) Copy Packer and [jq](https://stedolan.github.io/jq/) binaries from their source sites, host them publically from a server/service under your control (e.g. your own S3 bucket), and replace links in `circle.yml` and `deploy/packer.sh`. This will help avoid 404 "surprises". 


TODO: AWS resource naming convention
