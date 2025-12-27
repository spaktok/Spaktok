# Operations (Ops) Directory

This directory contains all DevOps-related files including scripts, Docker configurations, and operational artifacts.

## Directory Structure

### `/scripts/`
Operational scripts for setup, deployment, and maintenance:
- `setup.ps1`, `setup.sh` - Initial project setup scripts
- `setup_local.ps1`, `setup_local.sh` - Local development environment setup
- `setup_assets.ps1` - Asset setup script
- `deploy.ps1`, `deploy.bat` - Deployment scripts
- `git-clean-and-commit.ps1` - Git maintenance script
- `test-project.bat` - Project testing script

### `/docker/`
Docker-related configuration files:
- `docker-compose.yml` - Base Docker Compose configuration
- `docker-compose.dev.yml` - Development environment configuration
- `docker-compose.prod.yml` - Production environment configuration
- `docker-compose.override.yml` - Local overrides
- `Dockerfile.dev` - Development Dockerfile

### `/nginx/`
Nginx web server configuration:
- `nginx.conf` - Nginx configuration file

### `/artifacts/`
Build artifacts and generated files:
- `project_tree.txt` - Repository file tree (generated artifact)

### `/repo_hygiene/`
Repository maintenance and backup files (existing):
- Backup archives
- Repository cleanup artifacts

## Usage

### Running Setup Scripts
```powershell
# Windows PowerShell
.\ops\scripts\setup_local.ps1

# Unix/Linux/Mac
./ops/scripts/setup_local.sh
```

### Using Docker Compose
```bash
# From repository root
docker-compose -f ops/docker/docker-compose.yml up

# For development
docker-compose -f ops/docker/docker-compose.dev.yml up
```

### Deployment
```powershell
# Windows
.\ops\scripts\deploy.ps1

# Or
.\ops\scripts\deploy.bat
```

## Notes

- All scripts should be run from the repository root directory
- Docker files reference relative paths from the repository root
- See `documentation/guides/` for detailed usage instructions
