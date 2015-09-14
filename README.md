# Demo App

An Express 4 boilerplate app that serves as a POC of a deployment process to AWS that utilizes [CircleCI](https://circleci.com/), [Packer](https://packer.io/), and [Ansible](http://www.ansible.com/)

## Description

TODO

## Setup

1. Modify (and if necessary, rename) `deploy/packer/vars/aws_oregon.json` with settings that reflect your AWS environment. These settings tell Packer where/how the **amazon-ebs** builder will spin up a temporarity EC2 instance used for provisioning and artifact AMI creation.
2. Add a **demo_app** project to CircleCI and set up the following environment variables:
  * AWS_REGION           - example: us-west=2
  * CIRCLE_TOKEN         - CircleCI API token needed by the `do-exclusively.sh` script
  * INSTANCE_TYPE_DEV    - desired EC2 instance type for the dev environment
  * INSTANCE_TYPE_STAGE  - desired EC2 instance type for the stage environment
  * INSTANCE_TYPE_PROD   - desired EC2 instance type for the prod environment
  * SOURCE_AMI           - source AMI for Packer to use for the temporary EC2 instance. This allows for common configuration steps (e.g. OS patching, centralized logging setup) to be performed one time and "baked" into a custom source AMI that is inherited by the final AMI artifact, saving time during the build process and preventing duplication
3. (optional) Copy Packer and [jq](https://stedolan.github.io/jq/) binaries from their source sites, host them publically from a server/service under your control (e.g. your own S3 bucket), and replace links in `circle.yml` and `deploy/packer.sh`. This will help avoid 404 "surprises". 


TODO: Circle AWS credentials, AWS resource naming convention, IAM policies
