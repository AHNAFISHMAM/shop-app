# Troubleshooting Logs

> **Part of EvolveDoc System** - Self-evolving documentation that learns from your codebase

This folder contains detailed troubleshooting logs for code fixes that required manual intervention after 3 failed AI attempts.

## File Naming Convention

Format: `[type]_[YYYY-MM-DD]_[issue-id].md`

- **Type:** `frontend` or `backend`
- **Date:** `YYYY-MM-DD` format
- **Issue ID:** Short identifier (e.g., `login-error`, `type-error-001`)

**Examples:**
- `frontend_2025-01-27_login-error.md`
- `backend_2025-01-27_api-timeout.md`
- `frontend_2025-01-27_1.md` (if multiple issues same day)

## Structure

Each log file follows the template in `.template.md` and includes:
- Issue description
- Error messages
- Failed attempts summary
- Successful fix (detailed)
- Lessons learned
- Tags for searchability

## Search

Use the root `TROUBLESHOOTING.md` file to search all issues by:
- Date
- Type (front-end/back-end)
- Tags
- Files affected

## Best Practices

Based on industry standards:
- **Unique Identifiers:** Each issue has a unique ID for tracking
- **Standardized Format:** Consistent structure across all logs
- **Contextual Information:** Includes error messages, stack traces, and code context
- **Tags/Categories:** Searchable tags for easy filtering
- **Lessons Learned:** Actionable insights for prevention

---

**Total Logs:** 0  
**Last Updated:** 2025-01-27

