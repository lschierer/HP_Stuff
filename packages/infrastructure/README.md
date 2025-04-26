# HP Stuff Infrastructure

This package contains the infrastructure code for deploying the HP Stuff website to AWS.

This version of the infrastructure as code is SST based.

## Files

- ./index.ts: Configure the Site.  There are a number of shared variables across the 3 main components, and *only* three main components, it just looks like more becuase the API Gateway requires several for loops to populate with all the functions it will be a gateway *for*.
- ./sst.config.ts: main SST config file, sets up the region and other global sst variables
- ./sst-env.d.ts: required by SST
