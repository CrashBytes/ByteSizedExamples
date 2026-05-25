# Security

## Dependency policy

This tutorial's `requirements.txt` is updated periodically to pull in
upstream security fixes. Versions are pinned so the tutorial remains
reproducible, but every pin reflects the latest patched release available
at the time of the most recent maintenance pass.

Last security review: **2026-05-24** — see commit history for the diff.

## Known unfixable vulnerability: Horovod

Horovod (latest release `0.28.1`, July 2023) is effectively dormant
upstream. It carries an unpatched CRITICAL vulnerability
[GHSA-mrhh-3ggq-23p2](https://github.com/advisories/GHSA-mrhh-3ggq-23p2),
and its cmake-based C++ extension fails to build against modern PyTorch
and toolchains.

For these reasons, **Horovod has been removed from the default install**.
The tutorial's training-loop snippets that reference `import horovod`
will not run as-is. Two paths forward depending on your goal:

| Goal | Recommended path |
|---|---|
| Reproduce the original tutorial exactly | `pip install 'horovod[pytorch]==0.28.1'` after the main install (will likely fail to build against modern PyTorch; you are accepting the CRITICAL CVE) |
| Build new distributed training code | Use [`torch.nn.parallel.DistributedDataParallel`](https://pytorch.org/docs/stable/notes/ddp.html) instead — built into PyTorch, actively maintained, no Horovod-equivalent CVE exposure |

## Reporting vulnerabilities

Use GitHub's private vulnerability reporting on this repository:
**Security → Report a vulnerability**.
