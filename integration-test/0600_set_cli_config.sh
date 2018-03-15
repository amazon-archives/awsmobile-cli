#!/bin/bash
set -e
echo $0
echo $1
echo $2
echo $3
DIRPATH=~/.awsmobilejs
FILEPATH=$DIRPATH/awsmobile-cli-config.json
echo $DIRPATH
echo $FILEPATH
if [ ! -d $DIRPATH ]; then
    echo mkdir $DIRPATH
    mkdir $DIRPATH
fi
CLICONFIG="{\"isInDevMode\":true, \"awsmobileAPIEndpoint\":\"$3\"}"
echo $CLICONFIG > $FILEPATH
echo end