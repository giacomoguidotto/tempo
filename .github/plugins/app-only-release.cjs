"use strict";
const { execSync } = require("node:child_process");
const analyzer = require("@semantic-release/commit-analyzer");
const notesGenerator = require("@semantic-release/release-notes-generator");

function getAppCommits(commits) {
  return commits.filter((commit) => {
    try {
      const files = execSync(
        `git diff-tree --no-commit-id --name-only -r ${commit.hash} -- app/`,
        { encoding: "utf-8" }
      ).trim();
      return files.length > 0;
    } catch {
      return false;
    }
  });
}

async function analyzeCommits(pluginConfig, context) {
  const filtered = getAppCommits(context.commits);
  return await analyzer.analyzeCommits(pluginConfig, {
    ...context,
    commits: filtered,
  });
}

async function generateNotes(pluginConfig, context) {
  const filtered = getAppCommits(context.commits);
  return await notesGenerator.generateNotes(pluginConfig, {
    ...context,
    commits: filtered,
  });
}

module.exports = { analyzeCommits, generateNotes };
