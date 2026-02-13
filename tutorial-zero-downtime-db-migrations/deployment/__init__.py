"""
Deployment Module

Provides blue-green database migration orchestration for zero-downtime deployments.
"""

from .blue_green_migration import BlueGreenMigration

__all__ = ["BlueGreenMigration"]
