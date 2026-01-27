# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased]

### Added
- Initial public release
- Map-first interface for local sightings with MapLibre GL
- Admin authentication and management panel
- PostgreSQL and file-based storage options
- Comprehensive test coverage with Vitest and Playwright
- CI/CD pipeline with GitHub Actions
- Security scanning with CodeQL
- Automated dependency management with Dependabot
- Release management with standard-version

## [0.1.0] - 2026-01-27

Initial development release with core functionality.

### Features
- Map-based interface for viewing and creating sightings
- Interactive marker placement with location search
- Admin panel with secure authentication (bcrypt + JWT)
- Dual storage backends (PostgreSQL and file-based JSON)
- RESTful API with comprehensive error handling
- Responsive design with Tailwind CSS
- Server-side rendering with Next.js 16

### Technical
- Clean Architecture with dependency injection
- Domain-driven design patterns
- Comprehensive unit test coverage (>90%)
- End-to-end testing with Playwright
- Type safety with TypeScript and Zod validation
- Docker support for development and production
- CI/CD workflows for testing and security scanning
