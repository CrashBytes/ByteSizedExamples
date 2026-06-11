// Metro configuration for an Expo app inside an npm-workspaces monorepo.
// It teaches Metro to (1) watch the whole repo so changes to @cb/rag-core hot
// reload, and (2) resolve packages from both the app's and the repo root's
// node_modules (where workspace symlinks live).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// Workspaces hoist dependencies to the root; disable hierarchical lookup so a
// single copy of React is resolved (avoids "Invalid hook call" duplicate-React
// errors that bite monorepos).
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
