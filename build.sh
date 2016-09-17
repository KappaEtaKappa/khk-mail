#!/bin/bash

if ! which node > /dev/null 2>&1; then
	echo "Node not installed. Install and retry"
	exit 1
fi
if ! which npm > /dev/null 2>&1; then
	echo "npm not installed. Install and retry"
	exit 1
fi

git pull origin master
npm install

echo '/etc/postfix/main.cf => /etc/postfix/main.cf.back'
if cp /etc/postfix/main.cf /etc/postfix/main.cf.back; then
	if cp ./cp/main.cf /etc/postfix/main.cf; then
		echo Success
	else
		exit 1
	fi
else
	exit 1
fi

postmap /opt/khk-web/khk-mail/forwarders
postfix reload


