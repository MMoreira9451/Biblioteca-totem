.PHONY: install run test lint format migrate upgrade downgrade seed clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  install     Install dependencies using poetry"
	@echo "  run         Run development server"
	@echo "  test        Run all tests"
	@echo "  lint        Run linting (flake8 + mypy)"
	@echo "  format      Format code with black"
	@echo "  migrate     Generate new migration"
	@echo "  upgrade     Apply database migrations"
	@echo "  downgrade   Rollback last migration"
	@echo "  seed        Seed database with initial data"
	@echo "  clean       Clean cache and temporary files"

# Installation
install:
	poetry install
	poetry run pre-commit install

# Development
run:
	poetry run python -m app.main

# Testing
test:
	poetry run pytest tests/ -v --cov=app --cov-report=term-missing

test-unit:
	poetry run pytest tests/ -m "unit" -v

test-integration:
	poetry run pytest tests/ -m "integration" -v

# Code quality
lint:
	poetry run flake8 app tests
	poetry run mypy app

format:
	poetry run black app tests

# Database
migrate:
	poetry run alembic revision --autogenerate -m "$(message)"

upgrade:
	poetry run alembic upgrade head

downgrade:
	poetry run alembic downgrade -1

seed:
	poetry run python -m app.db.init_db

# Cleanup
clean:
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -delete
	find . -type d -name ".mypy_cache" -delete

# Docker
docker-build:
	docker build -t library-kiosk-backend .

docker-run:
	docker run -p 8000:8000 --env-file ../.env library-kiosk-backend