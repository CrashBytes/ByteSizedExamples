"""
Migrations Module

Provides versioned database migration management with automatic rollback support.
"""

from .migration_manager import MigrationManager, MigrationScript

__all__ = ["MigrationManager", "MigrationScript"]
