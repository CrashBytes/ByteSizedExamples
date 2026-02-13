# Security Policy

## 🔒 Security Considerations

This repository contains a framework for database migrations. Please follow these security guidelines when using this code in production environments.

## ⚠️ Important Security Warnings

### Default Credentials in Examples

**DO NOT use the default credentials from this repository in production!**

The following files contain default/example credentials **for local development only**:

- `docker-compose.yml`: `postgres/postgres` and `admin@example.com/admin`
- `config/config.example.yml`: `postgres/postgres`
- Example scripts: Connection strings with `postgres/postgres`

### Before Production Use

**Required Security Steps:**

1. **Change All Passwords**
   ```bash
   # Never use default passwords in production!
   # Generate strong passwords:
   openssl rand -base64 32
   ```

2. **Secure Configuration Files**
   ```bash
   # Copy the example config
   cp config/config.example.yml config/config.yml
   
   # Update with production credentials
   # Ensure config.yml is in .gitignore (it is!)
   chmod 600 config/config.yml
   ```

3. **Use Environment Variables**
   ```bash
   # Production credentials should come from environment
   export DB_BLUE_PASSWORD="$(cat /run/secrets/db_blue_password)"
   export DB_GREEN_PASSWORD="$(cat /run/secrets/db_green_password)"
   ```

4. **Enable SSL/TLS**
   ```yaml
   # In production config
   databases:
     blue:
       host: production-blue.example.com
       sslmode: require
       sslrootcert: /path/to/ca-cert.pem
   ```

## 🛡️ Production Security Checklist

### Database Security

- [ ] Strong, unique passwords (minimum 32 characters)
- [ ] TLS/SSL encryption for all connections
- [ ] Certificate validation enabled
- [ ] Least-privilege database users
- [ ] Network isolation (VPC/private networks)
- [ ] IP allowlisting for database access
- [ ] Audit logging enabled
- [ ] Regular security patches applied

### Application Security

- [ ] Credentials stored in secrets management (Vault, AWS Secrets Manager, etc.)
- [ ] No credentials in code or version control
- [ ] Environment-specific configurations
- [ ] Access logs enabled and monitored
- [ ] Rate limiting on migration operations
- [ ] Monitoring and alerting configured
- [ ] Backup encryption enabled
- [ ] Rollback procedures tested

### Access Control

- [ ] Multi-factor authentication (MFA) required
- [ ] Role-based access control (RBAC) implemented
- [ ] Regular access audits performed
- [ ] Principle of least privilege enforced
- [ ] Service accounts properly secured
- [ ] SSH keys rotated regularly

## 🔐 Recommended Security Practices

### 1. Secrets Management

**Use a proper secrets manager:**

```python
# Bad - Hardcoded credentials
conn_string = "postgresql://user:password@host/db"

# Good - From secrets manager
import boto3

def get_db_credentials():
    client = boto3.client('secretsmanager')
    secret = client.get_secret_value(SecretId='prod/db/blue')
    return json.loads(secret['SecretString'])

credentials = get_db_credentials()
conn_string = f"postgresql://{credentials['user']}:{credentials['password']}@{credentials['host']}/{credentials['db']}"
```

### 2. Network Security

**Use private networks and bastion hosts:**

```yaml
# Production architecture
┌─────────────────────┐
│   Bastion Host      │
│   (Jump Server)     │
└──────────┬──────────┘
           │
    ┌──────▼───────┐
    │   VPC        │
    │  ┌────────┐  │
    │  │ Blue   │  │
    │  │ DB     │  │
    │  └────────┘  │
    │  ┌────────┐  │
    │  │ Green  │  │
    │  │ DB     │  │
    │  └────────┘  │
    └──────────────┘
```

### 3. Audit Logging

**Enable comprehensive logging:**

```python
import logging

# Configure audit logging
audit_logger = logging.getLogger('audit')
audit_logger.info(
    'Migration initiated',
    extra={
        'user': current_user,
        'action': 'cutover_to_green',
        'timestamp': datetime.now().isoformat(),
        'source_ip': request.remote_addr
    }
)
```

### 4. Backup Before Migration

**Always backup before migrations:**

```bash
# Automated backup before migration
pg_dump -Fc blue_db > backup_$(date +%Y%m%d_%H%M%S).dump

# Encrypt backup
gpg --encrypt --recipient admin@company.com backup_*.dump

# Upload to secure storage
aws s3 cp backup_*.dump.gpg s3://secure-backups/ \
    --sse aws:kms \
    --sse-kms-key-id alias/backup-key
```

## 🚨 Reporting Security Vulnerabilities

If you discover a security vulnerability in this framework, please report it privately:

**DO NOT create a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email**: Send details to security@crashbytes.com
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Response Time**:
   - Acknowledgment: Within 48 hours
   - Initial assessment: Within 5 business days
   - Fix timeline: Depends on severity

### Security Response

- **Critical**: Patch within 24-48 hours
- **High**: Patch within 1 week
- **Medium**: Patch within 1 month
- **Low**: Patch in next release

## 📋 Security Audit History

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2025-01-XX | Initial Release | N/A | ✅ Clean |

## 🔄 Security Updates

Subscribe to security updates:
- Watch this repository
- Subscribe to CrashBytes security notifications
- Follow [@CrashBytes](https://twitter.com/crashbytes) for updates

## 📚 Additional Resources

- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
- [CIS PostgreSQL Benchmark](https://www.cisecurity.org/benchmark/postgresql)

## ⚖️ Disclaimer

This software is provided "as is" without warranty of any kind. Users are responsible for implementing appropriate security measures in their production environments. See [LICENSE](LICENSE) for full terms.

---

**Remember**: Security is not a one-time setup but an ongoing process. Regularly review and update your security measures.
