# Manifesto

Default working principles for product-focused software projects.

Project-specific docs may override these defaults when the constraint is real and written down.

## Principles

- Build the smallest version that can prove or disprove the idea. Prefer fast iteration over speculative architecture.
- Treat UX issues as real bugs. Confusing labels, awkward states, janky motion, and unnecessary friction matter even when the logic is technically correct.
- Optimize for the user's mental model, but stay truthful. Copy and UI states should feel right without misrepresenting what the system is doing.
- Prefer platform primitives and maintained libraries by default. Reach for custom code when product quality, brand consistency, or platform gaps justify it, and make that choice explicit.
- Use smart defaults. Pre-fill, suggest, and remove blank-state friction whenever the choice is low-risk and easy to change.
- When multiple paths are valid, present the options, tradeoffs, and a recommendation. Do not make important product or architecture decisions silently.

## Execution

- Verify assumptions before coding: API availability, platform support, dependency compatibility, version constraints, and runtime boundaries.
- Start simple. Add complexity only after evidence shows the simple version is not enough.
- If the same fix fails twice, stop patching symptoms and re-evaluate the model.
- Don't be afraid to break down and rebuild when tech debt is driving workarounds instead of clean, simple solutions. A rewrite costs less than a thousand patches.
- Let tooling win by default. Run formatting, linting, typechecking, and the most relevant tests before handing work off.
- Commit coherent changes with clear messages. Avoid amending history unless explicitly asked.
- Debug from evidence. Read the real error, reproduce the issue, and follow the failure chain before guessing.
