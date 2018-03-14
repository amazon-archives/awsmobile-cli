#!/bin/bash
set -e
echo $0
rm -rf blankproject
mkdir blankproject
cd blankproject
../node_modules/awsmobile-cli/bin/awsmobile configure aws $1 $2 us-east-1
../node_modules/awsmobile-cli/bin/awsmobile init -y
../node_modules/awsmobile-cli/bin/awsmobile user-signin enable
../node_modules/awsmobile-cli/bin/awsmobile user-files enable
../node_modules/awsmobile-cli/bin/awsmobile cloud-api enable
../node_modules/awsmobile-cli/bin/awsmobile database enable
../node_modules/awsmobile-cli/bin/awsmobile analytics enable
../node_modules/awsmobile-cli/bin/awsmobile hosting enable
../node_modules/awsmobile-cli/bin/awsmobile push
../node_modules/awsmobile-cli/bin/awsmobile delete
cd ..
rm -rf blankproject
echo end