#!/usr/bin/env bash
# Script de build pour le déploiement (Render / Railway).
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
