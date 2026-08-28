<!--
  ¿Qué? Historia de usuario que describe la verificación de correo tras el registro.
  ¿Para qué? Formalizar cómo el usuario activa su cuenta desde el enlace enviado por correo.
  ¿Impacto? Sin este paso, ninguna cuenta recién registrada podría iniciar sesión.
-->

# HU-003 — Verificación de Email

## Identificación

| Campo            | Valor                  |
| ---------------- | ------------------------ |
| **ID**           | HU-003                    |
| **Título**       | Verificación de email     |
| **Módulo**       | Autenticación               |
| **Prioridad**    | Alta                         |
| **Estado**       | Por implementar              |
| **RF asociados** | RF-003                        |

---

## Historia

**Como** usuario recién registrado,
**quiero** hacer clic en el enlace de verificación que llega a mi correo,
**para** activar mi cuenta y poder iniciar sesión.

---

## Criterios de Aceptación

### CA-003.1 — Activación exitosa
- **Dado que** hago clic en el enlace de verificación recibido por correo,
- **cuando** el token es válido (no expirado, no usado),
- **entonces** mi cuenta queda activa (`isEmailVerified = true`) y veo un mensaje de éxito con enlace al login.

### CA-003.2 — Token expirado
- **Dado que** el enlace de verificación tiene más de 24 horas,
- **cuando** hago clic en él,
- **entonces** debo ver un mensaje indicando que el enlace expiró.

### CA-003.3 — Token ya usado
- **Dado que** ya verifiqué mi cuenta anteriormente,
- **cuando** vuelvo a hacer clic en el mismo enlace,
- **entonces** debo ver un mensaje indicando que ese enlace ya fue utilizado.

---

## Endpoints

| Método | Ruta                          | Descripción                          |
| ------ | ----------------------------- | --------------------------------------- |
| POST   | `/api/v1/auth/verify-email`   | Activa la cuenta con el token del email |

---

## Notas técnicas

- El token de verificación expira en 24 horas y es de un solo uso.
