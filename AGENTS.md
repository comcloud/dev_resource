# Shared Feature Capability Repository

Store extracted implementations at `capabilities/<feature>/<variant>/`.

Discover reusable capabilities by scanning `capabilities/*/*/capability.yaml`. Read `capability.yaml` first, followed by `product.md`, `integration.md`, and `verification.md`. Treat `feature` as the canonical function and `variant` as one source application's proven implementation.

Use the `deposit-feature-capability` Skill to publish packages. Do not overwrite another variant, include secrets or production data, or claim portability unless the manifest status and verification evidence support it.
