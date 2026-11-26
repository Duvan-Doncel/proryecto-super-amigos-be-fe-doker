<!--
  ¿Qué? Roles, división de tareas, aporte medible y feedback del equipo de Super Amigos Grooming Spa.
  ¿Para qué? Evidenciar el criterio 13: trabajo dividido, asignación de tareas y retroalimentación.
  ¿Impacto? Las cifras salen de git y de GitHub (verificables por el instructor); las opiniones
  las escribe cada integrante en su propia sección.
-->

# 🤝 Feedback del equipo y división de tareas

| Campo | Valor |
|---|---|
| Proyecto | Super Amigos Grooming Spa — Ficha 3228970 |
| Fuente de las cifras | `git log` de todas las ramas y API de GitHub, corte 24-nov-2026 |
| Asignación de tareas | [`scrum.md`](scrum.md) · [`matriz-rotacion.md`](matriz-rotacion.md) · [tablero](https://github.com/users/Duvan-Doncel/projects/1) |

---

## 1. Roles

| Integrante | Usuario GitHub | Rol | Responsabilidad principal |
|---|---|---|---|
| Santiago Doncel | `Duvan-Doncel` | Full stack · coordinación | Integración FE + BE, CI, Docker, repositorio y entregas |
| Álvaro Espejo | `alvaroespejo2006-source` | Base de datos | Modelo de datos (Prisma), migraciones, pruebas contra la BD |
| Juan Rodríguez | `Juan-wiki` | Backend | Endpoints del API, reglas de negocio, pruebas de API |
| Yesid Valencia | `ysvalenciarejercito-code` | Frontend | Pantallas React, componentes, pruebas de componente y E2E |

Además del rol fijo, en la fase de pruebas **todos rotaron por las cuatro capas** (Front, API,
BD, E2E) una semana cada una, según el bootcamp; ver la matriz de rotación.

## 2. Cómo se dividió el trabajo

| Fase | Fechas | Cómo se repartió |
|---|---|---|
| Desarrollo (sprints 1–4) | ago – sep 2026 | Por módulo y rol: auth, mascotas, citas y semáforo, tienda, inventario y ventas ([`scrum.md`](scrum.md)) |
| Pruebas (sprints 5–6) | oct – nov 2026 | Rotación semanal de capa: una rama `test/s<semana>-<capa>-<nombre>` y un PR por persona por semana |
| Entrega (sprint 7) | nov 2026 | Documentación por especialidad: cada uno revisa la parte de su rol (tareas en el documento de cierre) |

## 3. Aporte medible

| Integrante | Commits propios | Commits de pruebas | PRs mergeados | PRs abiertos | Revisiones hechas a otros |
|---|---|---|---|---|---|
| Santiago | 27 | 13 | 7 | 2 | 4 aprobaciones (#6, #8, #10, #17) |
| Álvaro | 10 | 6 | 6 | 0 | 4 aprobaciones (#2, #7, #9, #13) |
| Yesid | 7 | 7 | 4 | 2 | — |
| Juan | 6 | 5 | 0 | 2 (+3 ramas sin PR) | 1 comentario (#16) |

> Los commits de Santiago incluyen la implementación de la fase de desarrollo, que se subió
> desde su cuenta en pocos commits grandes (27-ago y septiembre). Por eso git no muestra quién
> programó cada módulo en esa fase; el equipo lo registra en la columna "Responsable" del tablero.

## 4. Retroalimentación del equipo

### ✅ Qué funcionó

- **Rotación de capas**: los cuatro escribieron pruebas en al menos tres capas distintas; nadie
  quedó encasillado en una sola tecnología.
- **Las pruebas encontraron defectos reales** (respuestas 500 que debían ser 422/404) y cada
  corrección llegó con su prueba.
- **CI en cada PR**: ningún cambio llegó a `main` con pruebas en rojo.
- **Convención de ramas y commits** clara (`test/sN-capa-nombre`, `test(be): …`, `docs: …`).

### ⚠️ Qué mejorar

| Situación | Evidencia | Acuerdo |
|---|---|---|
| Revisión cruzada irregular | 9 de 17 PRs mergeados entraron sin aprobación de otro integrante (#3, #4, #5, #11, #12, #16, #18, #22, #23) | Activar en GitHub la regla "1 aprobación requerida" en `main` |
| Carga desigual | Santiago: 27 commits; Juan: 6 | Repartir la siguiente fase por módulo con responsable visible en el tablero |
| PRs que quedan abiertos | 6 PRs abiertos de las semanas 4–6 y 3 ramas sin PR | Revisión de PRs pendientes al cierre de cada semana |
| Trazabilidad de la fase de desarrollo | Código en pocos commits grandes desde una cuenta | Commits pequeños, cada uno desde la cuenta de quien lo escribe |
| Tablero Scrum tardío | El tablero se formalizó en el sprint 7 | Usar el tablero desde el primer sprint del próximo proyecto |

## 5. Feedback individual

Cada integrante completa su parte (2–3 frases por pregunta). Sin estas secciones el criterio
queda incompleto.

### Santiago Doncel — Full stack

- **Qué aporté:** _…_
- **Qué aprendí:** _…_
- **Qué haría distinto:** _…_
- **Feedback para un compañero:** _…_

### Álvaro Espejo — Base de datos

- **Qué aporté:** _…_
- **Qué aprendí:** _…_
- **Qué haría distinto:** _…_
- **Feedback para un compañero:** _…_

### Juan Rodríguez — Backend

- **Qué aporté:** _…_
- **Qué aprendí:** _…_
- **Qué haría distinto:** _…_
- **Feedback para un compañero:** _…_

### Yesid Valencia — Frontend

- **Qué aporté:** _…_
- **Qué aprendí:** _…_
- **Qué haría distinto:** _…_
- **Feedback para un compañero:** _…_
