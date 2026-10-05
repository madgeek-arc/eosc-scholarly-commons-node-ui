#!/bin/bash

## Init vars
CONF_TMPL=/etc/nginx/nginx.conf.txt
PROXY_CONF_FILE=/etc/nginx/conf.d/site.conf
EMAIL_ARG="--register-unsafely-without-email"
ADD_SERVER_NAME=""
ADD_PROXY_API=""
ADD_PROXY_PAGES=""

# do not forget to escape proxy vars (else envsubst removes them)
read -r -d '' ADD_PROXY_API_CONF << EOM
    location ^~ /api {
         proxy_set_header        Host \$host;
         proxy_set_header        X-Real-IP \$remote_addr;
         proxy_set_header        X-Forwarded-For \$proxy_add_x_forwarded_for;
         proxy_set_header        X-Forwarded-Proto \$scheme;
         proxy_pass              ${PROXY_API_ENDPOINT};
         proxy_read_timeout      300;
         proxy_send_timeout      300;
         client_max_body_size    200M;
    }
EOM

# Joomla site (PROXY_PAGES_ENDPOINT, e.g. https://innovation.openaire.eu) embedded in iframes.
# It must be served from our own origin: Joomla sends X-Frame-Options: SAMEORIGIN, and its fonts
# have no CORS headers. /pages/ is stripped, the asset prefixes are passed through as they are.
# ^~ makes these win over the regex locations in nginx.conf.txt.
# /images is shared with the local data volume: local files first, Joomla as the fallback.
read -r -d '' ADD_PROXY_PAGES_CONF << EOM
    location ^~ /pages/ {
         proxy_set_header        Host \$proxy_host;
         proxy_set_header        X-Forwarded-For \$proxy_add_x_forwarded_for;
         proxy_set_header        X-Forwarded-Proto \$scheme;
         proxy_ssl_server_name   on;
         proxy_pass              ${PROXY_PAGES_ENDPOINT}/;
    }

    location ^~ /templates/ {
         proxy_set_header        Host \$proxy_host;
         proxy_ssl_server_name   on;
         proxy_pass              ${PROXY_PAGES_ENDPOINT};
    }

    location ^~ /media/ {
         proxy_set_header        Host \$proxy_host;
         proxy_ssl_server_name   on;
         proxy_pass              ${PROXY_PAGES_ENDPOINT};
    }

    location ^~ /component/ {
         proxy_set_header        Host \$proxy_host;
         proxy_ssl_server_name   on;
         proxy_pass              ${PROXY_PAGES_ENDPOINT};
    }

    location ^~ /images/ {
         root                    /usr/share/nginx/html/data;
         try_files               \$uri @pages_fallback;
    }

    location @pages_fallback {
         proxy_set_header        Host \$proxy_host;
         proxy_ssl_server_name   on;
         proxy_pass              ${PROXY_PAGES_ENDPOINT};
    }
EOM


## Create Nginx configuration ##
if [ -f "$PROXY_CONF_FILE" ]; then
    echo "Nginx configuration already exists: $PROXY_CONF_FILE "
else
    echo "Creating Nginx configuration: $PROXY_CONF_FILE"

    [ ! -z ${SERVER_NAME+x} ] && export ADD_SERVER_NAME="server_name ${SERVER_NAME}";
    [ ! -z ${PROXY_API_ENDPOINT+x} ] && export ADD_PROXY_API=$(echo "$ADD_PROXY_API_CONF");
    [ ! -z ${PROXY_PAGES_ENDPOINT+x} ] && export ADD_PROXY_PAGES=$(echo "$ADD_PROXY_PAGES_CONF");
    envsubst '${ADD_SERVER_NAME} ${ADD_PROXY_API} ${ADD_PROXY_PAGES}' < $CONF_TMPL > $PROXY_CONF_FILE

    rm /etc/nginx/conf.d/default.conf || echo "File '/etc/nginx/conf.d/default.conf' already deleted. OK"
    nginx -t
    cat $PROXY_CONF_FILE
    nginx -s reload
fi

nginx -g "daemon off;"
