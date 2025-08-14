#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python edtech/manage.py collectstatic --no-input
python edtech/manage.py migrate
