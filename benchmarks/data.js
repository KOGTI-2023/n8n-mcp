window.BENCHMARK_DATA = {
  "lastUpdate": 1769535884739,
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
      },
      {
        "commit": {
          "author": {
            "email": "56956555+czlonkowski@users.noreply.github.com",
            "name": "Romuald Członkowski",
            "username": "czlonkowski"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c8c76e435d80953cdbde3fc8b86675285c555b30",
          "message": "fix: critical memory leak from per-session database connections (#554)\n\n* fix: critical memory leak from per-session database connections (#542)\n\nEach MCP session was creating its own database connection (~900MB),\ncausing OOM kills every ~20 minutes with 3-4 concurrent sessions.\n\nChanges:\n- Add SharedDatabase singleton pattern - all sessions share ONE connection\n- Reduce session timeout from 30 min to 5 min (configurable)\n- Add eager cleanup for reconnecting instances\n- Fix telemetry event listener leak\n\nMemory impact: ~900MB/session → ~68MB shared + ~5MB/session overhead\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\nConceived by Romuald Czlonkowski - https://www.aiadvisors.pl/en\n\n* fix: resolve test failures from shared database race conditions\n\n- Fix `shutdown()` to respect shared database pattern (was directly closing)\n- Add `await this.initialized` in both `close()` and `shutdown()` to prevent\n  race condition where cleanup runs while initialization is in progress\n- Add double-shutdown protection with `isShutdown` flag\n- Export `SharedDatabaseState` type for proper typing\n- Include error details in debug logs\n- Add MCP server close to `shutdown()` for consistency with `close()`\n- Null out `earlyLogger` in `shutdown()` for consistency\n\nThe CI test failure \"The database connection is not open\" was caused by:\n1. `shutdown()` directly calling `this.db.close()` which closed the SHARED\n   database connection, breaking subsequent tests\n2. Race condition where `shutdown()` ran before initialization completed\n\nConceived by Romuald Członkowski - www.aiadvisors.pl/en\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\n\n* test: add unit tests for shared-database module\n\nAdd comprehensive unit tests covering:\n- getSharedDatabase: initialization, reuse, different path error, concurrent requests\n- releaseSharedDatabase: refCount decrement, double-release guard\n- closeSharedDatabase: state clearing, error handling, re-initialization\n- Helper functions: isSharedDatabaseInitialized, getSharedDatabaseRefCount\n\n21 tests covering the singleton database connection pattern used to prevent\n~900MB memory leaks per session.\n\nConceived by Romuald Członkowski - www.aiadvisors.pl/en\n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.5 <noreply@anthropic.com>",
          "timestamp": "2026-01-23T19:51:22+01:00",
          "tree_id": "3a906ff4048963c970a61034513573e40decb4d9",
          "url": "https://github.com/KOGTI-2023/n8n-mcp/commit/c8c76e435d80953cdbde3fc8b86675285c555b30"
        },
        "date": 1769535884006,
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