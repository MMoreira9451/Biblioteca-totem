#!/bin/sh
# Activate Poetry virtual environment and run the application

# Find the virtualenv path
VENV_PATH=$(poetry env info --path)

# Activate it and run the app
. "$VENV_PATH/bin/activate"
python -m app.main
