# Makefile for things3-workflow Obsidian plugin
# This Makefile wraps npm scripts and provides common development tasks.

# Variables
NPM := npm
ESLINT := npx eslint
TSC := npx tsc
RM := rm -rf
MKDIR := mkdir -p

# Directories
DIST_DIR := dist
BUILD_DIR := build

# Default target
all: install build

# Install dependencies
install:
	$(NPM) install

# Clean the repository (remove build artifacts and node_modules)
clean:
	$(RM) $(DIST_DIR) $(BUILD_DIR) node_modules
	$(RM) *.log

# Lint the code
lint:
	npx eslint src/

# Lint and auto-fix the code
lint-fix:
	npx eslint --fix src/

# Build the plugin
build:
	mkdir -p dist
	$(NPM) run build
	cp manifest.json dist/
	@if [ -f styles.css ]; then cp styles.css dist/; fi
	cp node_modules/sql.js/dist/sql-wasm.wasm dist/

# Copy build artifacts to root for manual install (optional, if needed)
copy-artifacts:
	cp dist/main.js ./main.js

# Run development mode (watch)
dev:
	$(NPM) run dev

# Bump version
version:
	$(NPM) run version

# Bump the plugin version (updates manifest.json and versions.json)
bump-version:
	node version-bump.mjs

# Type-check (using TypeScript compiler)
typecheck:
	$(TSC) -noEmit -skipLibCheck

# Placeholder for tests (add test script to package.json when implemented)
test:
	$(NPM) test

# Serve documentation locally using Docusaurus
docs:
	cd docs-site && npm install && npm run start

# Phony targets
.PHONY: all install clean lint build dev version typecheck test docs
