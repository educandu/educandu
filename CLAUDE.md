# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educandu is an open-source educational content framework for creating and managing OER (Open Educational Resources) learning platforms. The repository produces an npm package (`@educandu/educandu`) that can be integrated into applications to provide a complete learning management system with support for interactive educational content, user management, SAML authentication, and multimedia plugins.

## Common Commands

### Development
- `gulp` - Build and start the test app in watch mode (default task)
- `gulp test` - Run all tests with coverage
- `gulp lint` - Run eslint
- `gulp fix` - Run eslint in fixing mode

### Build
- `gulp build` - Build the dist package (JS transpilation + copy non-JS files)
- `gulp clean` - Remove dist and coverage directories

### Testing Individual Files
Use vitest directly:
```bash
npx vitest run path/to/file.spec.js
npx vitest watch path/to/file.spec.js
```

## Architecture

### Core Layers

**Bootstrap Layer** (`src/bootstrap/`)
- `server-bootstrapper.js` - Creates and configures the DI container, registers all services, stores, managers
- `client-bootstrapper.js` - Hydrates React app on client, sets up client-side DI container with managers (resources, theme, licenses, plugins), preloads modules and page components
- `server-config.js` - Validates and manages server configuration using Joi schemas
- `client-config.js` - Manages client-side configuration subset

**Server Layer** (`src/server/`)
- Express-based controllers handle HTTP requests
- `educandu-server.js` - Main Express app setup
- `controller-factory.js` - Registers and manages all controllers
- Controllers follow pattern: `{name}-controller.js` with corresponding routes

**Services Layer** (`src/services/`)
- Business logic and orchestration
- Services consume stores and implement domain operations
- Examples: `document-service.js`, `user-service.js`, `batch-service.js`
- `scheduling/job-scheduler.js` - Manages background jobs using toad-scheduler

**Stores Layer** (`src/stores/`)
- Direct database and CDN access
- `database.js` - MongoDB connection and operations
- `cdn.js` - AWS S3 CDN operations
- Individual stores: `document-store.js`, `user-store.js`, etc.
- `collection-specs/` - MongoDB collection schemas and indexes

**Domain Layer** (`src/domain/`)
- Constants, validation schemas, domain-specific middleware
- `validation.js` - Joi-based validation utilities
- `needs-authentication-middleware.js`, `needs-permission-middleware.js` - Auth guards
- `schemas/` - Joi validation schemas for API requests

### Frontend Architecture

**Components** (`src/components/`)
- React components organized by feature area
- `pages/` - Full page components (admin, dashboard, document, etc.)
- Context providers: `user-context.js`, `settings-context.js`, `container-context.js`
- Shared UI components for forms, media, navigation

**Plugins System** (`src/plugins/`)
- Extensible content plugin architecture
- Each plugin has:
  - `{name}-info.js` - Plugin metadata and registration
  - `{name}-display.js` - Component for displaying content to users
  - `{name}-editor.js` - Component for editing content
  - `{name}-icon.js` - Plugin icon component
  - `{name}.less` - Plugin-specific styles (optional)
  - `{name}.yml` - Plugin-specific translations (optional)
- `plugin-registry.js` - Registers all built-in plugins
- Built-in plugins include: markdown, image, video, audio, abc-notation, ear-training, interactive-media, etc.
- Custom plugins can be added via `customResolvers.resolveCustomPluginInfos`

**UI/API Layer**
- `src/ui/` - Client-side utilities (api-helper, mime-type-helper)
- `src/api-clients/` - Client-side API wrappers
- Server-side rendering support via `bootstrap/server-renderer.js`

### Data Flow

1. **Request Flow**: HTTP → Controller → Service → Store → Database/CDN
2. **DI Container** (`src/common/di.js`): Custom singleton-only dependency injection
   - Retrieve instances via `container.get(MyService)`
   - Most classes auto-instantiated with dependencies injected into constructor
   - Dependencies declared via static `dependencies` property on class
   - Complex instances (Database, Cdn, etc.) manually instantiated in in `server-bootstrapper.js` (server-side) or `client-bootstrapper.js` (client-side) and registered via `container.registerInstance()`
   - Detects circular dependencies automatically
3. **Client Hydration**: Server renders initial HTML with data in `window.__*__` globals (user, settings, resources, theme, etc.), then `client-bootstrapper.js` hydrates React app using `ReactDOMClient.hydrateRoot()`
4. **Migrations**: Database migrations in `migrations/` directory, managed by umzug
5. **Resources**: i18n translations in YAML files (`src/**/*.yml`), compiled to `src/resources/resources.json`
   - Translations use namespaced structure (namespace as top-level key)
   - Translation files placed next to the components that use them
   - `src/resources/common.yml` contains shared translations
   - Uses `i18next` and `i18next-icu` for ICU format support

### Configuration System

Applications using educandu provide configuration including:
- Database connection (MongoDB with replica set)
- CDN configuration (AWS S3)
- SMTP settings for emails
- Session/cookie configuration
- Custom resolvers for templates, logos, plugins
- Plugin list to enable
- SAML authentication setup (optional)
- AMB endpoint configuration (optional)

See [README.md](README.md) for complete configuration options.

### Testing

- Test files: `*.spec.js` alongside source files
- Test framework: Vitest with coverage via `@vitest/coverage-v8`
- Mocking: Sinon for stubs/spies, `node-mocks-http` for HTTP mocking
- Run specific tests: `npx vitest run path/to/file.spec.js`

### Build System

- Build tool: Gulp with tasks defined in `gulpfile.js`
- Transpilation: esbuild for both dist package and test app
- Styles: LESS compilation
- Translations: YAML → JSON merging via `@educandu/dev-tools`
- Output: `dist/` (npm package), `test-app/dist/` (test application)

### Local Development Environment

Required services (Docker containers):
- **MongoDB** (port 27017) - Main database with replica set
- **MinIO** (port 9000) - S3-compatible CDN storage, UI at http://localhost:9000
- **Maildev** (ports 8025 SMTP, 8000 UI) - Email testing at http://localhost:8000
- **Test app** (port 3000 or 400x for multiple instances)

### Key Technical Details

- **Node.js version**: ^20.0.0
- **React**: ~18.2.0 (server-side and client-side rendering)
- **Database**: MongoDB with replica set required
- **Authentication**: Passport.js with local and SAML strategies
- **File uploads**: Multer with S3 storage
- **Styling**: LESS with Ant Design theming
  - CSS follows SuitCSS naming conventions
  - LESS files placed side-by-side with React components
  - Component parts nested inside parent component class in LESS
- **i18n**: i18next with ICU format support (i18next-icu)
  - Translation YAML files co-located with components
  - Namespaced translation structure
- **Module system**: ES modules (type: "module")
- **Package manager**: Yarn
