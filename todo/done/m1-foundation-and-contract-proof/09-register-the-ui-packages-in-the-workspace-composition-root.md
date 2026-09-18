---
title: Register the ui packages in the workspace composition root
tags: [workspace]
depends_on: [6]
group: M1 — Foundation and contract proof
completed_at: 2026-09-18T04:27:06Z
---
Make `repos/ui` visible to the workspace.

**These edits land in the workspace repo, not in this checkout.** `repos/ui` is
currently invisible to it — `workspace.yaml` declares mionso, framework, nzila,
org and todo-md only.

## Scope

- `workspace.yaml` — add the `ui` entry.
- Root `package.json` — add `repos/ui/packages/*` and `repos/ui/apps/*` to
  `workspaces`, and a `file:` override per package.
- `tools/verify-order.ts` — the ui packages typecheck and test before todo-md.

## From the spec

> ```diff
>   workspace.yaml
> +   ui:
> +     url: https://github.com/lemol/ui.git
> +     ref: main
>
>   package.json (workspace root)
>     "workspaces": [ "repos/*",
> +     "repos/ui/packages/*", "repos/ui/apps/*",
>     ]
>     "overrides": {
> +     "@lemol/ui-design":     "file:./repos/ui/packages/ui-design",
> +     "@lemol/ui-remix":      "file:./repos/ui/packages/ui-remix",
> +     "@lemol/ui-remix-mini": "file:./repos/ui/packages/ui-remix-mini",
>     }
>
>   tools/verify-order.ts
> +   the ui packages typecheck and test before todo-md
> ```

> **Private, consumed as git dependencies**, like `framework` / `org` / `nzila`,
> with root `overrides` redirecting to local clones.

## Done when

- `bun install` at the workspace root resolves `@lemol/ui-*` to the local clones.
- `verify-order` runs the ui packages before todo-md.
