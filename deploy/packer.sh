#!/bin/bash

# install packer (from official Linux archive)
if [ ! -d ./packer ] || [ ! -f ./packer/packer ]; then
  mkdir packer
  wget -O ./packer/packer.zip https://dl.bintray.com/mitchellh/packer/packer_0.8.6_linux_amd64.zip
  unzip ./packer/packer.zip -d ./packer
fi