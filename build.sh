#!/bin/bash

if ! which node > /dev/null 2>&1; then
	echo "Node not installed. Install and retry"
	exit 1
fi
if ! which npm > /dev/null 2>&1; then
	echo "npm not installed. Install and retry"
	exit 1
fi

echo :: Updatng Repository
git pull origin master

echo :: Installing Node Dependencies
npm install

echo :: Installing NGINX site files
cd cp

site=$(find . -maxdepth 1 -name "*.site")
echo $site
if [ -f $site ]; then
 sudo cp $site /etc/nginx/sites/. -v
else
	echo !! Project is missing a NGINX ./cp/*.site config.
  echo !!! Please see the README.
  exit 1
fi
echo :: Testing updated NGINX site config for ${D#./}.
echo ::: \(Previously loaded sites may have already broken NGINX\) 
echo `sudo nginx -t`

echo :: Installing System Service Daemon
service=$(find . -maxdepth 1 -name "*.service")
if [ -f $service ]; then
	sudo cp $service /etc/systemd/system/.
	sudo systemctl daemon-reload
	sudo systemctl enable ${service#./}
  sudo systemctl start ${service#./}
  echo Press Q to Continue
  sudo systemctl status ${service#./}
else
	echo !! Project is missing a systemd ./cp/*.service file.
	echo !!! Please see the README.
  exit 1
fi

echo :: Moving '/etc/postfix/main.cf => /etc/postfix/main.cf.back'
if cp /etc/postfix/main.cf /etc/postfix/main.cf.back; then
	echo :: Installing PostFix
  if cp ./main.cf /etc/postfix/main.cf; then
    echo ::: PostFix Installed
	else
		echo !! PostFix Installation Failed
		exit 1
	fi
else
  echo !! PostFix Backup Failed
	exit 1
fi

cd ..

echo :: Updating Postfix Post Map and Reloading
postmap /opt/khk-web/khk-mail/forwarders
postfix reload
