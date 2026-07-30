#!/bin/bash
set -e

# Run this script as root (or with sudo).

CONF_SRC="/home/pasha/cook-and-fry/deploy/nginx-cook-and-fry.conf"
SITE_NAME="cook-and-fry"
SITE_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"

cp "$CONF_SRC" "${SITE_DIR}/${SITE_NAME}"
ln -sf "${SITE_DIR}/${SITE_NAME}" "${ENABLED_DIR}/${SITE_NAME}"

# Remove the default site if it conflicts with the IP-based server block.
if [ -L "${ENABLED_DIR}/default" ]; then
    rm "${ENABLED_DIR}/default"
fi

nginx -t
systemctl reload nginx

echo "Nginx config applied for ${SITE_NAME}"
