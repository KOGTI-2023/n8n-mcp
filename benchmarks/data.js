window.BENCHMARK_DATA = {
  "lastUpdate": 1768321213868,
  "repoUrl": "https://github.com/KOGTI-2023/n8n-mcp",
  "entries": {
    "n8n-mcp Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "bthompson@maillocker.net",
            "name": "Bryan Thompson",
            "username": "triepod-ai"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2713db6d106f30554f3f144c548504c2097f2741",
          "message": "feat: add MCP tool annotations to all 20 tools (#512)\n\n* feat: add MCP tool annotations to all 20 tools\n\nAdd MCP tool annotations per specification to help AI assistants\nunderstand tool behavior and capabilities.\n\nDocumentation tools (7):\n- tools_documentation, search_nodes, get_node, validate_node,\n  get_template, search_templates, validate_workflow\n- All marked readOnlyHint=true (local database queries)\n\nManagement tools (13):\n- n8n_create_workflow, n8n_get_workflow, n8n_update_full_workflow,\n  n8n_update_partial_workflow, n8n_delete_workflow, n8n_list_workflows,\n  n8n_validate_workflow, n8n_autofix_workflow, n8n_test_workflow,\n  n8n_executions, n8n_health_check, n8n_workflow_versions,\n  n8n_deploy_template\n- All marked openWorldHint=true (n8n API access)\n- Destructive operations (delete_workflow, executions delete,\n  workflow_versions delete/truncate) marked destructiveHint=true\n\nAnnotations follow MCP spec:\nhttps://spec.modelcontextprotocol.io/specification/2025-03-26/server/tools/#annotations\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\n\n* feat: add idempotentHint to all read-only tools\n\nAdds idempotentHint: true annotation to all read-only tools that produce\nthe same output when called multiple times:\n- 7 documentation tools (tools.ts)\n- 4 management tools (tools-n8n-manager.ts): n8n_get_workflow,\n  n8n_list_workflows, n8n_validate_workflow, n8n_health_check\n\nAlso adds trailing newline to tools-n8n-manager.ts.\n\nConceived by Romuald Członkowski - www.aiadvisors.pl/en\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\n\n* feat: add idempotentHint to update operations, bump to 2.31.5\n\nAdds idempotentHint: true to update operations that produce the same\nresult when called repeatedly with the same arguments:\n- n8n_update_full_workflow\n- n8n_update_partial_workflow\n- n8n_autofix_workflow\n\nAlso bumps version to 2.31.5 and updates CHANGELOG.md with complete\ndocumentation of all MCP tool annotations added in this PR.\n\nConceived by Romuald Członkowski - www.aiadvisors.pl/en\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: triepod-ai <noreply@github.com>\nCo-authored-by: Claude Opus 4.5 <noreply@anthropic.com>\nCo-authored-by: Romuald Członkowski <romualdczlonkowski@MacBook-Pro-Romuald.local>",
          "timestamp": "2026-01-02T15:48:47+01:00",
          "tree_id": "2699ee78d2f42d632b1937c421986a2d38a7f1b7",
          "url": "https://github.com/KOGTI-2023/n8n-mcp/commit/2713db6d106f30554f3f144c548504c2097f2741"
        },
        "date": 1767422791244,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "sample - array sorting - small",
            "value": 0.0136,
            "range": "0.3096",
            "unit": "ms",
            "extra": "73341 ops/sec"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "czlonkowski@gmail.com",
            "name": "czlonkowski",
            "username": "czlonkowski"
          },
          "committer": {
            "email": "czlonkowski@gmail.com",
            "name": "czlonkowski",
            "username": "czlonkowski"
          },
          "distinct": true,
          "id": "a6dcbd2473634e8afd1d4aa9613971287733a6bd",
          "message": "docs: remove outdated docs/CHANGELOG.md\n\nThe docs/CHANGELOG.md had incomplete version history (jumped from\n2.33.1 to 2.14.4). The root CHANGELOG.md is the canonical changelog\nwith complete version history.\n\nConceived by Romuald Czlonkowski - www.aiadvisors.pl/en\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>",
          "timestamp": "2026-01-12T10:47:56+01:00",
          "tree_id": "0c7e80f566c8874f0f0ec5f806a431551a0f8894",
          "url": "https://github.com/KOGTI-2023/n8n-mcp/commit/a6dcbd2473634e8afd1d4aa9613971287733a6bd"
        },
        "date": 1768321213118,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "sample - array sorting - small",
            "value": 0.0136,
            "range": "0.3096",
            "unit": "ms",
            "extra": "73341 ops/sec"
          }
        ]
      }
    ]
  }
}