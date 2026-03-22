# Calculadora de Tarifas — ArtDäSak

Herramienta de cálculo estratégico de tarifas profesionales, construida en HTML, CSS y JavaScript Vanilla.

🔗 **[Ver en vivo →](https://artdasak.github.io/CalculadoraTarifas)**

---

## ¿Qué hace?

A partir de un ingreso mensual objetivo y la capacidad de trabajo real, calcula tres niveles de precio para cobrar servicios profesionales:

| Nivel | Descripción |
|---|---|
| **Piso de cobro** | Referencia base. Límite inferior para negociaciones. |
| **Tarifa estándar** | Rango para condiciones normales de trabajo. |
| **Tarifa objetivo** | La tarifa comercial de referencia real. |

También permite estimar el precio total de un proyecto a partir de su duración en horas, días, semanas o meses.

Todos los valores monetarios se redondean hacia arriba al siguiente múltiplo de $1.000, generando cifras limpias y comercialmente manejables.

---

## Lógica de cálculo

1. **Ingreso mensual objetivo** ÷ **horas disponibles al mes** = valor base bruto por hora
2. El valor bruto se redondea ↑ al siguiente múltiplo de $1.000 → **valor base por hora**
3. Valor base × multiplicadores (mínimo / estándar / objetivo) → tres tarifas, cada una redondeada ↑
4. Tarifas × horas estimadas del proyecto → tres precios, cada uno redondeado ↑

### Reglas del sistema
- Promedio mensual fijo: `4.33` semanas (52 semanas ÷ 12 meses)
- Ningún multiplicador puede bajar de `1.5`
- El redondeo es siempre hacia arriba (`Math.ceil`), nunca hacia abajo

---

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura e interfaz |
| `styles.css` | Sistema visual (dark/light mode, paleta índigo-violeta) |
| `script.js` | Lógica de cálculo, redondeo y renderizado |
| `logo.png` | Logotipo ArtDäSak |

---

## Características visuales

- Dark mode por defecto, con toggle a light mode (guardado en `localStorage`)
- Paleta índigo-violeta refinada sin exceso de azul
- Jerarquía visual clara: la **tarifa objetivo** es siempre el valor más prominente
- Diseño responsive (mobile-first a partir de 780px)
- Tooltips contextuales en cada campo con explicaciones de uso

---

## Despliegue

El proyecto se sirve directamente desde GitHub Pages sin proceso de build.
Cualquier push a la rama principal actualiza la versión en vivo de forma inmediata.

---

*© 2025 ArtDäSak · Todos los derechos reservados*
