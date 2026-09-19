# Documentation

How the layers of `@lemol/ui` fit together, and why they are the way they are.

| Topic | File |
| --- | --- |
| The rules every layer follows, and the reason for each | [principles.md](principles.md) |
| The shipping shape, layer boundaries, and the dependency rules | [architecture.md](architecture.md) |
| The token layer: schema, the component-token contract, themes, variants | [design-system.md](design-system.md) |
| Behaviour: the native-first ladder, the command protocol, the baseline | [interactivity.md](interactivity.md) |
| Motion: tokens, native entry/exit, reduced motion, view transitions | [motion.md](motion.md) |

Layer specifics live in each `src/<layer>/README.md`. The component catalogue is
documented in `src/remix/README.md`, added as components land, so it describes
components that exist rather than components that are planned.

## Two kinds of document

The documents above describe **what is true now**. Keep them current; if code
and a document disagree, fix one of them deliberately rather than letting them
drift.

`docs/superpowers/specs/` holds **dated decision records** — the reasoning
behind a choice at the moment it was made, including the alternatives that were
rejected and why. Those are not maintained as the code changes; they are a
record. Read them to understand *why* something was decided, and read these to
understand *what* the system is.
