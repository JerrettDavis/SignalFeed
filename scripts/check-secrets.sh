#!/usr/bin/env bash
#
# Secret Detection Script for Git Pre-Commit Hook
# Scans staged files for secrets and blocks commit if found
#

set -euo pipefail

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Exit if not in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || echo "")

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo -e "${GREEN}🔍 Scanning staged files for secrets...${NC}"

# Secret patterns to detect
declare -A PATTERNS=(
  ["Database URLs"]="postgres(ql)?://[^:]+:[^@]+@|mysql://[^:]+:[^@]+@|mongodb(\+srv)?://[^:]+:[^@]+@"
  ["Stripe API Keys"]="sk_(live|test)_[a-zA-Z0-9]{24,}|pk_(live|test)_[a-zA-Z0-9]{24,}"
  ["Generic API Keys"]="sk-[a-zA-Z0-9]{32,}|api[_-]?key['\"]?\s*[:=]\s*['\"][a-zA-Z0-9]{20,}"
  ["Resend API Keys"]="re_[a-zA-Z0-9]{24,}"
  ["AWS Keys"]="AKIA[0-9A-Z]{16}|aws[_-]?(access[_-]?key|secret)"
  ["JWT Tokens"]="eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}"
  ["Private Keys"]="BEGIN [A-Z ]*PRIVATE KEY"
  ["Hardcoded Passwords"]="password['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]"
  ["Generic Secrets"]="secret['\"]?\s*[:=]\s*['\"][^'\"]{20,}['\"]"
  ["Supabase URLs"]="supabase\.co/.*:[^@]+@"
)

# Files that should never be committed
BLOCKED_FILES=(
  ".env.production.local"
  ".env.local"
  ".env.production"
  ".env.development.local"
  "credentials.json"
  "service-account.json"
  ".aws/credentials"
)

SECRETS_FOUND=0
BLOCKED_FILES_FOUND=0

# Check for blocked files
for file in $STAGED_FILES; do
  for blocked in "${BLOCKED_FILES[@]}"; do
    if [[ "$file" == *"$blocked"* ]] || [[ "$file" == "$blocked" ]]; then
      if [ $BLOCKED_FILES_FOUND -eq 0 ]; then
        echo -e "${RED}❌ BLOCKED FILES DETECTED${NC}"
      fi
      echo -e "${RED}  ✗ $file${NC}"
      BLOCKED_FILES_FOUND=$((BLOCKED_FILES_FOUND + 1))
    fi
  done
done

# Check each staged file for secrets
for file in $STAGED_FILES; do
  # Skip if file doesn't exist (deleted files)
  if [ ! -f "$file" ]; then
    continue
  fi

  # Skip this script itself (it contains patterns by design)
  if [[ "$file" == "scripts/check-secrets.sh" ]]; then
    continue
  fi

  # Skip binary files
  if ! file "$file" | grep -q "text"; then
    continue
  fi

  # Skip example files only
  if [[ "$file" == *".example" ]]; then
    continue
  fi

  # Check each pattern
  for pattern_name in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$pattern_name]}"

    # Get the staged content (not working directory content)
    if git show ":$file" 2>/dev/null | grep -qE "$pattern"; then
      if [ $SECRETS_FOUND -eq 0 ]; then
        echo -e "${RED}❌ SECRETS DETECTED${NC}"
      fi
      echo -e "${RED}  ✗ $file${NC}"
      echo -e "${YELLOW}    Pattern: $pattern_name${NC}"

      # Show the matching lines (with context)
      git show ":$file" 2>/dev/null | grep -E "$pattern" --color=always | head -3 | sed 's/^/    /'

      SECRETS_FOUND=$((SECRETS_FOUND + 1))
      break # Only report once per file
    fi
  done
done

# Report results
if [ $BLOCKED_FILES_FOUND -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  COMMIT BLOCKED: Sensitive files detected${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}These files should NEVER be committed:${NC}"
  echo "  - Add them to .gitignore"
  echo "  - Remove them from staging: git reset HEAD <file>"
  echo ""
  exit 1
fi

if [ $SECRETS_FOUND -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  COMMIT BLOCKED: Secrets detected in $SECRETS_FOUND file(s)${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Action Required:${NC}"
  echo "  1. Remove hardcoded secrets from these files"
  echo "  2. Use environment variables instead (process.env.VARIABLE)"
  echo "  3. Store secrets in .env files (add to .gitignore)"
  echo "  4. Use secret management: Vercel, AWS Secrets Manager, etc."
  echo ""
  echo -e "${YELLOW}To review staged changes:${NC}"
  echo "  git diff --cached <file>"
  echo ""
  echo -e "${YELLOW}To remove secrets:${NC}"
  echo "  git reset HEAD <file>  # Unstage the file"
  echo "  # Edit the file to remove secrets"
  echo "  git add <file>         # Stage again"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ No secrets detected. Safe to commit.${NC}"
exit 0
