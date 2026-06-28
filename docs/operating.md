# Compact Operating Guide

## Start Prompt

```text
Usa la skill compact. Mantén 40% de headroom. Responde breve. Lee solo contexto necesario. Si el hilo crece, compacta estado y sigue.
```

## Long Task Prompt

```text
/goal [resultado concreto]. Usa modo compact. Mantén 40% de headroom. Verifica con [comando o criterio]. Al final: cambios, verificación, límites.
```

## Review Prompt

```text
Revisa solo riesgos reales. Hallazgos primero. Sin resumen largo. No pegues archivos completos.
```

## Compaction Prompt

```text
Compacta estado ahora: goal, constraints, changed files, verified, next, blockers. Quita logs y razonamiento repetido.
```

## Rules Of Thumb

- Prefer one task per thread.
- Start a new thread after a large completed milestone.
- Paste only the exact error line plus command used.
- Point Codex at file paths instead of pasting file contents.
- Ask for `diff + tests` when you want minimal final output.
