# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### CI/CD Pipeline (`ci.yml`)

Main CI/CD pipeline that runs on push and pull requests to main branches.

**Triggers:**

- Push to `main`, `master`, or `develop`
- Pull requests to these branches

**Jobs:**

1. **Lint & Type Check**
   - Runs ESLint for code quality
   - Runs TypeScript type checking
   - Fails on any errors

2. **Unit Tests**
   - Runs Vitest unit tests
   - Tests domain logic, use cases, and utilities

3. **E2E Tests (File Storage)**
   - Runs Playwright E2E tests with file-based storage
   - Fast execution for quick feedback
   - Tests complete user workflows

4. **E2E Tests (PostgreSQL)**
   - Runs Playwright E2E tests with PostgreSQL
   - Matches production environment
   - Uses GitHub Actions services for PostgreSQL
   - Runs database migrations and seeds test data
   - Tests database-specific functionality

5. **Build**
   - Builds Next.js application for production
   - Verifies build succeeds without errors
   - Uploads build artifacts

6. **Security Audit**
   - Runs `npm audit` to check for vulnerabilities
   - Continues on error (informational)

7. **Test Summary**
   - Aggregates results from all jobs
   - Fails if any critical job fails
   - Provides overall pass/fail status

**Environment Variables:**

```yaml
NODE_VERSION: "20.x"
POSTGRES_IMAGE: postgres:16-alpine
```

**Secrets Required:**

None - all configuration uses test values

**Artifacts:**

- **Playwright Reports** (30 days retention)
  - `playwright-report-file` - File storage test results
  - `playwright-report-postgres` - PostgreSQL test results
- **Build Output** (7 days retention)
  - `.next/` build directory

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Define the workflow name and triggers
3. Specify jobs and steps
4. Reference existing workflows for patterns

Example:

```yaml
name: My Workflow

on:
  push:
    branches: [main]

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run something
        run: echo "Hello"
```

## Debugging Workflows

### View Logs

1. Go to the "Actions" tab in GitHub
2. Click on the workflow run
3. Click on the job name to see logs

### Download Artifacts

1. Navigate to the workflow run
2. Scroll down to "Artifacts"
3. Click to download

### Re-run Failed Jobs

1. Open the failed workflow run
2. Click "Re-run jobs" → "Re-run failed jobs"

## Local Testing

Test workflows locally before pushing:

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
choco install act  # Windows

# Run a workflow
act -W .github/workflows/ci.yml
```

## Performance Optimization

### Caching

We use caching for:

- Node modules (`node_modules`)
- Playwright browsers
- Next.js build cache

### Parallel Execution

Jobs run in parallel where possible:

- Lint and unit tests run independently
- E2E tests run after build succeeds
- Build happens in parallel with other tests

### Resource Limits

- Ubuntu runners: 2 cores, 7 GB RAM
- Timeout: 30 minutes per job (default)
- Adjust with: `timeout-minutes: 60`

## Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/your-org/sightsignal/workflows/CI%2FCD%20Pipeline/badge.svg)
```

## Best Practices

1. **Keep workflows fast** - Fail fast on errors
2. **Use caching** - Cache dependencies and build outputs
3. **Parallel execution** - Run independent jobs in parallel
4. **Meaningful names** - Use descriptive job and step names
5. **Conditional execution** - Use `if:` to skip unnecessary steps
6. **Secrets management** - Never commit secrets, use GitHub Secrets
7. **Matrix builds** - Test across multiple versions when needed

## Troubleshooting

### Workflow Not Triggering

- Check branch name matches trigger
- Verify file is in `.github/workflows/`
- Check YAML syntax is valid

### Job Failing

1. Check the logs for error messages
2. Reproduce locally with same environment
3. Check for rate limits (npm, GitHub API)
4. Verify all required secrets are set

### Slow Execution

1. Enable caching for dependencies
2. Reduce test scope if possible
3. Use matrix builds sparingly
4. Consider self-hosted runners for private repos

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
