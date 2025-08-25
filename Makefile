.PHONY: dev install build lint format clean help

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	./scripts/dev.sh

build: ## Build for production
	npm run build

lint: ## Run ESLint
	npx eslint src --ext .ts,.svelte

format: ## Format code with Prettier
	npx prettier --write src

clean: ## Clean build artifacts and node_modules
	rm -rf .svelte-kit build dist node_modules

# Environment setup
env-copy: ## Copy .env.example to .env
	cp .env.example .env || true