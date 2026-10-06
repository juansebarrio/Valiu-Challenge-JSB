# Design system — Valiu (oficial) aplicado al challenge

Estado: **v1.0 · 6 oct 2026 · reemplaza a `design-system-provisional.md`**. Pendiente de OK en los puntos de la sección 9.

## 1. Fuentes y precedencia

El DS oficial llegó en dos piezas, ahora en `design-system/`:

| Pieza | Ruta | Qué es | Para qué lo usamos |
|---|---|---|---|
| Paquete "Valiu Design System" | `design-system/colors_and_type.css`, `ui_kit.html`, `preview/*.html`, `assets/` | Hoja de tokens (CSS vars), kit de UI, logos (`currentColor`), íconos SVG | **Archivo de tokens que cargan todas las pantallas**; logos |
| Skill `valiu-design-system` v7.1 | `design-system/figma-skill/references/tokens.md`, `components-atomic.md`, `components-complex.md` | Valores verificados contra Figma (`O1FiqHWikxySbGwwvRFJQe`), snippets canónicos, catálogo de íconos Unicons | **Valores a nivel de componente** (bordes, paddings, alturas, estados) |

Regla de precedencia cuando difieren: el valor de componente sale de `tokens.md` / `components-*.md` (verificados con Figma MCP); el nombre del token sale de `colors_and_type.css`. Las diferencias concretas están en la sección 8.

Cómo se arma `src/styles/tokens.css` (etapa 1): copia literal de `colors_and_type.css` + una capa de alias semánticos del challenge (`--app-*`) que apunta a esos tokens. Los componentes solo consumen `--app-*`. Cuando el DS cambie, se reemplaza la copia y se ajustan los alias; los componentes no se tocan.

Las 19 capturas de `referencias/capturas/` dejan de ser fuente de tokens; quedan como referencia de pantallas (fila "Referencia · producto actual" del tablero) y como evidencia de las inconsistencias que corregimos.

## 2. Color

### 2.1 Marca y tintas

| Token (`colors_and_type.css`) | Hex | Nombre Figma | Uso |
|---|---|---|---|
| `--valiu-indigo` | #3D46CC | Main/Dark Blue | Botón primario, borde de secundario, borde de alert info, tinta de marca |
| `--valiu-indigo-deep` | #2A32A8 | — | Énfasis, headers |
| `--valiu-indigo-press` | #252D92 | — | Primario presionado |
| `--valiu-indigo-100` | #EEF0FB | ≈ Selected bg #F0F1FD | Ítem seleccionado en listas |
| `--valiu-blue` | #0086FF | Main/Core Valiu Light | **Foco / activo**: borde de input activo (1 px), nav activo (texto e ícono), subrayado de tab activa, checkbox y switch ON, hover del primario, borde de la caja TDC (2 px), links |
| `--valiu-blue-bg` | #F6FBFF | Main/V20 | Fondo de nav activo, tab activa, hover del secundario |
| — (alias `--app-hover-soft`) | #EDF3FF | Main/V40 | Hover suave, selección secundaria |
| — (alias `--app-info-dot`) | #8BCAFB | Main/V60 | Punto del tag Descriptive / Info |
| — (alias `--app-chart-accent`) | #4D9EF7 | Main/V80 | Gráficas (proyección, tendencia) |
| `--ink-800` | #021734 | Main/Navy | Borde de input Empty / Filled (0.5 px) |
| `--ink-600` | #1C293B | Main/Dark Navy | Label de inputs |
| `--valiu-mint-bg` | #E8F7F9 | — | Franja de header del kit; fondo del tag Info |

**Las dos tintas azules son tokens distintos y no se intercambian** (nota crítica del DS): indigo = acción; core light = foco, activo y "ON". Esto revierte mi D-01 provisional.

### 2.2 Neutrales y superficies

| Token | Hex | Nombre Figma | Uso |
|---|---|---|---|
| `--ink-900` / `--fg-1` | #151522 | Neutral/V Black | Texto principal, valor de input |
| `--ink-500` / `--fg-2` | #5B5B64 | Greyscale/Grey1 | Texto secundario (7.0:1) |
| `--ink-400` / `--fg-3` | #8492A6 | Greyscale/Grey2 | Placeholder y subtexto (3.2:1 → ver 7.1) |
| `--ink-300` | #DCDCDE | Greyscale/Grey3 | Borde y texto de botones inactivos |
| `--ink-100` / `--bg-canvas` | #F5F7FA | Greyscale/Grey4 · bg page #F5F6F8 | Fondo de app, fondo de botones inactivos, tag Neutral |
| `--ink-0` / `--bg-surface` | #FFFFFF | Neutral/White | Tarjetas, modales, inputs |
| alias `--app-divider` | #E2E4E9 | Border / Divider | Separadores, filas de tabla, borde del sidebar (0.5 px) |
| alias `--app-currency` | #7A7A92 | Greyscale/Light | Código de divisa dentro de inputs (ver 7.1) |

### 2.3 Feedback (tags y alerts, valores Figma)

| Familia | Tag bg | Alert bg | Dot | Borde de alert / texto fuerte | Estados del challenge |
|---|---|---|---|---|---|
| Success | #EBFFF6 | #D5F3E6 | #82DAB5 | #17714B | Confirmada, Activo, Mercado abierto |
| Warning / Process | #FCEFCE | #FCEFCE | #F5CE6C | #C78F00 | En proceso, Mercado cerrado, precio por vencer |
| Error | #FFF1F1 | #F0CECE | #D26B6B | #770505 | Anulada, Cancelada, Devuelta, Rechazado, Precio vencido |
| Info / Descriptive | #E8F7F9 | #E8F7F9 | #8BCAFB | #3D46CC | Enviada, Pactada, Por autorizar, Por activar |
| Neutral | #F5F7FA | — | #8492A6 | — | Tipo de operación (Compra, Venta, Transferencia), etiqueta **Futuro** (variante sin punto y borde punteado Grey2) |

Texto de tag: 12/500 `#151522` siempre; el punto nunca es el único portador de significado (el label va siempre). Mapeo de estados **[confirmar con ui-actual.md]**.

## 3. Tipografía

Familia Montserrat (import en `colors_and_type.css`); pesos 400 / 500 / 600 / 700. Números con `font-variant-numeric: tabular-nums` en montos, tipos de cambio y columnas numéricas.

| Rol (Figma Text Styles) | Tamaño / interlínea / peso | Alias challenge | Uso |
|---|---|---|---|
| Display XL (`--type-display-xl`) | 32 / 36 / 700 | `--app-type-display` | Cifra de posición por divisa, una por pantalla |
| Headline XL | 24 / 24 / 600 | `--app-type-h1` | Título de página |
| Headline L | 20 / 24 / 600 | `--app-type-h2` | Título de panel lateral y modal |
| Body 1 Bold / Regular | 16 / 16 / 600 · 400 | `--app-type-h3` · `--app-type-body-lg` | Títulos de tarjeta y pasos · saldos, valor de inputs grandes |
| Body 2 Bold / Regular | 14 / 16 / 600 · 400 | `--app-type-body-strong` · `--app-type-body` | Base: celdas, nav, botones, montos de tabla |
| Label de input | 12 / 16 / 700 · `#1C293B` | `--app-type-label` | Labels de formulario (snippet verificado) |
| Caption Bold / Regular | 12 / 16 / 700 · 400 | `--app-type-caption` | Footer legal, ayudas; **nunca en tablas** |
| Overline | 10 / 8 / 600 · tracking 1.5 px | `--app-type-overline` | Código de divisa junto al saldo en tarjeta de cuenta; eyebrows |

Regla del brief que se superpone al DS: en tablas todo texto va en Body 2 (14); no se usan Caption ni Overline dentro de tablas.

## 4. Geometría, elevación, espaciado

| Propiedad | Valor DS | Uso |
|---|---|---|
| Radio 4 | botones Primary / Secondary, badge de bandera | `--radius-xs` |
| Radio 8 | inputs, dropdowns, tarjetas, alerts, ítem de nav, FAB terciario | `--radius-sm` |
| Radio 16 | tags pill, panel lateral (esquinas izquierdas) | `--radius-lg` |
| Radio 40 | botón flotante (Contáctanos), FAB | `--radius-2xl` |
| Shadow Mid | 0 3px 6px rgba(0,0,0,.08) | tarjetas, badge de bandera |
| Shadow High | 0 3px 6px rgba(0,0,0,.15) | FAB terciario, flotante |
| `--shadow-md` / `--shadow-lg` | ver css | popovers / modales y panel lateral |
| Espaciado | 4 / 8 / 12 / 16 / 24 / 32 / 40 / 64 | `--space-1..8`; nada fuera de la grilla |
| Input | padding 12, min-height 48, borde 0.5 px #021734; activo 1 px #0086FF; split de monto 1.5 px #0086FF | |
| Botón Large | padding 8 16, 14/700 → 36 px | `--type-cta` |
| Botón ExtraLarge | padding 8 16, 16/700 → 40 px | CTA principal del panel |
| Botón Mid | padding 4 16 → 28 px | acciones en tablas |
| Tag | padding 4 16 4 8, dot 8, gap 6 | |
| Alert | padding 16, gap 16, borde 1 px del color fuerte | |
| Tabs | padding 14 16, 16/600 activa sobre #F6FBFF con subrayado 2 px #0086FF; inactiva 16/400 Grey1 | |

## 5. Layout (valores DS + decisión para 1440 × 900)

| Elemento | DS | Challenge |
|---|---|---|
| Header webapp | 48 px | 48 px |
| Sidebar | 240 abierto / 64 cerrado, borde derecho 0.5 px #E2E4E9 | igual; ítems 40 px de alto, radio 8 |
| Nav activo | bg #F6FBFF, texto 14/600 #0086FF, ícono #0086FF | igual |
| Nav inactivo | 14/500 #151522; hover bg #F6FBFF | igual |
| Main | padding 32 | padding 32 |
| Tarjeta de cuenta (Spaced) | 349 px, padding 16 24 12, radio 8, Shadow Mid | mismo componente, ancho fluido en el home |
| Panel lateral | — (no está en el DS) | 440 px, surface, `--shadow-lg`, radio 16 a la izquierda |
| Modal | — | 480 px, radio 8 |
| Footer legal | — | Caption 12 Grey1, mención a Banco BASE |

## 6. Íconos y logo

- Íconos: **Unicons Line** vía CDN (`https://unicons.iconscout.com/release/v4.0.0/css/line.css`), tamaños 18 (sidebar), 24 (acciones), 20 (módulos), 16 (inputs), 14 (info). Catálogo nombre DS → clase en `figma-skill/references/tokens.md`. En Next.js: `@iconscout/react-unicons` (reemplaza a lucide-react del stack original; ver D-17).
- Íconos custom Valiu sin equivalente (Ai, Convert, Destinatario, Seguir divisa…): hay SVG de algunos en `design-system/assets/icons/` (`convert.svg`, `sitemap.svg`, `chart-line.svg`); el de **IA no está** → placeholder `uil-lightbulb-alt` hasta recibir el export de Figma (node `4345:745`).
- Logo: `referencias/logo/logo-valiu-dark.svg` (y variantes blue / light / glyph / wordmark); `fill="currentColor"`, se tiñe con `color`.

## 7. Aplicación en el challenge

### 7.1 Accesibilidad (regla del brief, por encima del DS)
- Texto informativo secundario en Grey1 `#5B5B64` (7.0:1). Grey2 `#8492A6` (3.2:1) solo en placeholders y en texto no informativo.
- Código de divisa: dentro de inputs puede ir `#7A7A92` como marca el DS (4.2:1, acompaña a un valor en 14/400); en tablas y resúmenes va Grey1 14/500.
- Foco visible: el DS lo resuelve con el borde #0086FF de 1 px en inputs; para botones, tabs y filas sumamos `outline: 2px solid #0086FF; outline-offset: 2px` en `:focus-visible` (no existe en el DS; alias `--app-focus-ring`).
- Puntos de estado del DS no llegan a 3:1; siempre van con texto.

### 7.2 Densidad y jerarquía (brief)
- Tablas: filas 44 px, texto 14, montos a la derecha con tabular-nums y peso 600.
- Una pieza protagonista por pantalla (posición por divisa): tarjeta blanca radio 8 + Shadow Mid. El resto sin tarjeta, separado con `--app-divider`. Panel y modal flotan con `--shadow-lg`.
- Un ícono para la IA, un formato de monto (`1,000,000.00 MXN`), uno de tipo de cambio (`18.091183`), uno de fecha (`05 oct 2026, 07:31`).

## 8. Diferencias entre las dos piezas del DS (y qué tomamos)

| Tema | `colors_and_type.css` | Figma refs (v7.1) | Tomamos |
|---|---|---|---|
| Hover del primario | `--valiu-indigo-hover` #333BB0 | #0086FF | Figma (#0086FF); press #252D92 del css |
| Pesos de títulos | 700 | 600 | Figma (600) vía alias `--app-type-*`; el css queda intacto |
| Label de input | `--type-label` 14/700 | 12/700 #1C293B | Figma |
| Fondo de app | #F5F7FA | #F5F6F8 | css (`--bg-canvas`) |
| Divisor | `--border-subtle` #DCDCDE | #E2E4E9 | Figma (#E2E4E9) para divisores; #DCDCDE para inactivos |
| Feedback | `--success` #44C857, `--warning` #EEAE09, `--danger` #B40909, bgs propios | tabla de la sección 2.3 | Figma para tags y alerts; `--success-strong` / `--danger` para texto fuerte y signo de montos |
| Radios | 4 / 8 / 12 / 16 / 24 / 40 | solo 4 / 8 / 16 / 40 | Figma |
| README del paquete | menciona púrpura #812DFB | — | El propio css lo descarta: indigo es el primario |

## 9. Para confirmar

1. Precedencia Figma refs > css en las 8 diferencias de arriba.
2. Íconos: Unicons (DS) en lugar de lucide-react (stack del pedido).
3. Grey1 para texto secundario informativo (7.1) y foco visible extra: dos reglas que el DS no trae.
4. Mapeo de estados a tags (2.3), en especial Mercado cerrado en Warning (así lo trae el DS) y no en Error.
5. Export del ícono de IA desde Figma (`4345:745`).
6. Siguen faltando `docs/ui-actual.md`, `brief-parte-1.md` y `consigna-parte-1.md`.
