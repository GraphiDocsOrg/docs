#!/usr/bin/env bash

OLD_CONFIG=`npm config get dry-run`

# allows all the files npm would deploy with to be logged out to console
npm config set dry-run true

yarn do:publish

npm config set dry-run "$OLD_CONFIG"
