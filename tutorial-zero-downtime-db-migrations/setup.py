"""
Setup configuration for Zero-Downtime Database Migrations package.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8")

setup(
    name="zero-downtime-db-migrations",
    version="1.0.0",
    description="Production-ready framework for zero-downtime database migrations",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="CrashBytes",
    author_email="info@crashbytes.com",
    url="https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations",
    project_urls={
        "Documentation": "https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/",
        "Source": "https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations",
        "Bug Tracker": "https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations/issues",
    },
    packages=find_packages(exclude=["tests", "tests.*", "examples", "docs"]),
    python_requires=">=3.9",
    install_requires=[
        "psycopg2-binary>=2.9.9",
        "asyncpg>=0.29.0",
        "pyyaml>=6.0.1",
        "typing-extensions>=4.9.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "black>=23.12.1",
            "flake8>=7.0.0",
            "mypy>=1.7.1",
        ],
        "monitoring": [
            "coloredlogs>=15.0.1",
            "prometheus-client>=0.19.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Database",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    keywords="database migration zero-downtime blue-green postgresql",
    entry_points={
        "console_scripts": [
            "db-migrate=migrations.cli:main",
        ],
    },
)
