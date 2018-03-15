#!/bin/bash
set -e
echo $0
npm -v
npm install --save-dev awsmobile-cli
node_modules/awsmobile-cli/bin/awsmobile --help
echo end