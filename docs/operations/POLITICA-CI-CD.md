# Politica de CI/CD - PanFree System

**Fecha:** 2026-10-13

---

## 1. Objetivo

Definir cuando los workflows de GitHub Actions son **estrictos** (bloquean el merge) y cuando son **tolerantes** (reportan sin bloquear), segun la fase del proyecto.

---

## 2. Estados del CI

### Estado A: Tolerante (Fase 0-3)

**Aplica durante:** preparacion, remediacion de seguridad, rotacion de claves, correcciones de codigo.

**Caracteristicas:**
- Todos los workflows con continue-on-error: true
- El objetivo es **detectar** problemas, no bloquear el trabajo
- Los PRs se pueden mergear aunque el CI falle
- **Excepcion:** security-scan.yml (gitleaks) es estricto desde el dia 1

**Razon:** durante la migracion el proyecto tiene dependencias no resueltas (falta package-lock.json, faltan env vars), y bloquear por eso frenaria el trabajo sin aportar valor.

### Estado B: Estricto (Fase 4+)

**Aplica cuando:**
- package-lock.json esta commiteado
- GitHub Secrets configurados (NEXT_PUBLIC_SUPABASE_URL, etc.)
- Cobertura de tests minima del 60%
- Supabase Advisors en verde
- Historial de Git purgado

**Caracteristicas:**
- Sin continue-on-error
- Los PRs fallan si lint, test o build fallan
- Branch protection en main
- PR obligatorio (no push directo)

---

## 3. Transicion A -> B

**Checklist para activar Estado B:**

- [ ] package-lock.json en el repo
- [ ] npm ci funciona localmente
- [ ] GitHub Secrets configurados:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] npm run build pasa localmente sin placeholders
- [ ] Al menos 3 tests unitarios reales (no passWithNoTests)
- [ ] Supabase Advisors sin issues de severidad 1-2
- [ ] git filter-repo ejecutado

**Cuando todos esten en OK:** editar .github/workflows/ci.yml y quitar los continue-on-error.

---

## 4. Workflows actuales

### ci.yml - Estado A

- **Dispara:** push a main/develop, PRs
- **Pasos:** install, lint, test, build
- **Todos los pasos:** continue-on-error: true
- **Build:** usa env vars placeholder

### security-scan.yml - Estado B (estricto desde el dia 1)

- **Dispara:** push a main/develop, PRs a main
- **gitleaks:** estricto (queremos ver leaks)
- **npm audit:** tolerante (|| true)

**Razon:** queremos que **cualquier secreto filtrado** aparezca inmediatamente en el CI. Es la unica manera de que no vuelva a pasar SEC-001.

---

## 5. Cuando modificar un workflow

| Situacion | Accion |
|---|---|
| Falso positivo en gitleaks | Agregar a .gitleaksignore |
| Workflow rompe por dependencia no disponible | Agregar continue-on-error: true temporal |
| Se agrega nuevo paso al build | Documentar en este archivo |
| Se pasa a Estado B | Actualizar secciones 2 y 4 |

---

## 6. Reglas de oro

1. **El CI nunca debe bloquear sin razon.** Si bloquea, la razon debe estar documentada.
2. **Antes de pasar a estricto, probar 1 semana en tolerante.** Evita sorpresas.
3. **Los secrets van en GitHub Secrets, nunca en el workflow.** Ver ${{ secrets.X }}.
4. **Documentar cada cambio de politica.** Este archivo es la fuente de verdad.
---

## Nota S25: script 	est no-op

El package.json **no tiene tests reales** (TST-001 sigue abierto).
Para que el CI no falle en el step Test, se agrego un script
\	est\ no-op al \package.json\:

\\\json
"test": "echo \"No tests configured yet (TST-001)\" && exit 0"
\\\

**Cuando se resuelva TST-001** (instalar Jest/Vitest + tests reales),
reemplazar por el script real. Mientras tanto, el CI corre Lint y Build
de verdad, y Test es un placeholder documentado.

**Razon**: \--passWithNoTests\ es flag de Jest, no de npm. Sin script
\	est\, npm falla antes de llegar a Jest.
