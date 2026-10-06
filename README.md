# Valiu · Flujo principal de pago (challenge 1)

Rediseño del home de Valiu y del flujo "pagar una factura en dólares con pesos", recreado en Next.js a partir del handoff de diseño (`docs/handoff/`). Una importadora entra, el home le muestra que le faltan 1,000 USD para los pagos de la semana, paga la factura de Shenzhen Parts Co. desde su cuenta en pesos en un panel lateral y vuelve al home con la posición resuelta. Incluye la rama de **fecha valor**, la pestaña **Operar clásico** y el **onboarding** de 4 pasos.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run check      # lint + typecheck + tests (vitest)
```

Node 22, Next 16 (App Router), React 19, TypeScript, Tailwind 4, `@iconscout/react-unicons`, Vitest. Sin librerías de componentes de terceros. Dinero en centavos enteros y tipo de cambio en millonésimas (`src/lib/dinero.ts`).

## Rutas y modos

| Ruta | Qué es |
|---|---|
| `/` | El prototipo en el escenario base. Es la URL de la prueba y de la presentación. |
| `/tablero/alta` | Frames 01–07, 03B–07B, Estados, 08–16 y 17–20 a 1280 px, renderizados con los mismos componentes en estados fijos (`src/state/escenarios.ts`). `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros de `/`:

- `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado` (base: faltante).
- `?congelar=1` fija el tipo de cambio indicativo (capturas y verificación).
- `?demo=1` muestra un control flotante con "Vencer precio" (deja la cuenta en 0:05), "Ver recorrido" y "Reiniciar escenario".
- `?recorrido=0` apaga el onboarding.

Estado en memoria: recargar reinicia el escenario (nada de localStorage). Solo escritorio: con menos de 1200 px aparece un aviso.

Teclado: **Esc** cierra el panel o el recorrido · **← →** mueven la selección en la fecha valor y en las opciones de origen · **Tab** recorre el panel con el foco atrapado · el token es un solo input de 6 dígitos (admite pegar) · el código `000000` simula un token incorrecto.

## Estructura

```
src/
  styles/tokens.css        copia literal del DS oficial (colors_and_type.css) + alias --app-*
  app/globals.css          Tailwind mapeado a los alias (ningún hex ni medida suelta en componentes)
  app/                     / · /tablero · /sistema
  data/escenario.ts        escenario, cuentas, pagos, destinatarios, tipo de cambio y escenarios (todo ficticio)
  lib/dinero.ts            centavos, micro-unidades y redondeo half-up con BigInt
  lib/fx.ts                deducción de par, operación y lado; cotizar({...}); precio ejecutable; fechas de liquidación (+ tests)
  lib/format.ts            un formato por tipo de dato (D-10)
  lib/posicion.ts          posición por divisa, proyección de la semana, consecuencia de cada origen (+ tests)
  state/estado.ts          estado en memoria y reducer puro
  state/derivados.ts       cuentas, pagos pendientes, posiciones y proyecciones derivados del estado
  state/vistas.ts          selectores: del estado a los props de cada componente
  state/escenarios.ts      estados iniciales por escenario y los frames de /tablero/alta
  state/flujo.test.ts      el flujo completo, frame por frame, con los números del handoff
  components/              AppShell, TarjetaPosicion, FranjaNuevo, FilaMovimiento, TarjetaTipoDeCambio, ModuloCuentas,
                           PanelOperar, OpcionOrigen, BloqueMonto, FechaLiquidacion, PrecioEjecutable, CampoToken,
                           AvisoResultado, PasoOnboarding, FormularioOperar (SelectorPar, SelectorDestino,
                           CampoMontoDoble, Cotizacion, CajaTdcValiu), AvisoVistaAnterior; ui/ (Boton, Badge, Alerta, Campo…)
docs/handoff/              el paquete de diseño tal como llegó: README, docs/, design-system/, prototipo/
docs/decisiones.md         correcciones aplicadas sobre el export, con el motivo
docs/design/frames/        una captura por frame del export · docs/design/verificacion/ capturas del recorrido de verificación
```

Cada componente lleva `data-component="Nombre"` con el nombre del handoff.

### Design system

`src/styles/tokens.css` tiene dos capas: la copia literal de `design-system/colors_and_type.css` (solo se quitó el `@import` de Google Fonts: Montserrat se carga con `next/font`) y los alias semánticos `--app-*` con los valores verificados en Figma (`docs/handoff/design-system/tokens-figma.md`, precedencias en `docs/handoff/docs/design-system-uso.md`). `globals.css` reinicia el tema de Tailwind y lo mapea a esos alias: `bg-app-primary`, `text-app-ink-2`, `rounded-sm`, `shadow-mid`, `text-caption`, `h-(--app-header-h)`… Los componentes consumen solo esas clases; cuando el DS cambie se reemplaza la capa 1 y se ajustan los alias.

### Estado

Un `useReducer` con el estado mínimo del README del handoff: pestaña, panel {abierto, paso, orden, origen, fecha valor, precio {indicativo | fijo | vencido}, token}, onboarding, formulario de Operar, operaciones hechas, tipo de cambio en vivo y pausa. El reducer es puro y determinista, así que `/tablero` construye cada frame aplicando acciones (`src/state/frames.ts`) y `flujo.test.ts` verifica frame por frame los montos del handoff (27,136.77 → 27,138.62 → 1,152,861.38, la pactada, 18,092.42 en Operar, el error de saldo, etc.).

Los selectores (`vistas.ts`) derivan todo lo demás: posiciones y proyección a partir de saldos y pagos pendientes, la consecuencia de cada cuenta de origen (`evaluarOrigen`), el home después de un pago enviado o pactado, el formulario de Operar con precio indicativo, fijo o vencido.

## Decisiones de implementación

- **Tipo de cambio en vivo**: USD/MXN se mueve en una banda de ±0.003 cada 3 s y se congela mientras hay un precio fijo (pendiente del handoff, etapa 4). Al cargar muestra los valores del brief; `/tablero` siempre es estático.
- **Precio ejecutable**: 18.092415 para la compra de USD (brief); para otras puntas y pares se aplica el mismo spread sobre el indicativo (`ejecutable()` en `posicion.ts`).
- **Cuenta EUR como origen**: "Pagas ≈ 1,390.18 EUR" sale de `fx.ts` (EUR/USD a la punta de venta 1.079); el prototipo tenía 1,388.89 calculado a mano con 1.08.
- **Orden de las TarjetaPosicion**: USD, MXN, EUR, como en los frames (`ORDEN_POSICIONES` en el escenario).
- **"Pagar" del encabezado**: el paso "¿A quién le pagas?" no está diseñado; se muestra un paso provisional que lista los pagos cargados y aclara que falta el destinatario nuevo.
- **Onboarding**: se muestra una vez (flag en `localStorage`) y se repite con `?recorrido=1`; el diseño no trae un ítem "Ayuda" en el menú, así que no se agregó. Mide el elemento objetivo en runtime (`getBoundingClientRect`) y funciona también escalado en `/tablero`.
- **Panel**: en la app queda fijo al viewport (overlay, foco inicial, Esc, devuelve el foco al cerrar); en los frames es absoluto dentro del frame de 1280 px.
- **Sidebar**: colapsa a 64 px (solo íconos, logo glyph) bajo 1100 px de ancho del shell con una container query; la grilla del home pasa a una columna bajo 900 px.
- **Botón Mid**: 32 px (14/24 + 4 16) como lo renderiza el prototipo; Large 36 y ExtraLarge 40 como el handoff.
- **Íconos**: `@iconscout/react-unicons` no publica tipos ni las variantes `angle-down-b` / `angle-up-b`; se declaran los tipos en `src/types/` y se usan `angle-down` / `angle-up`. Los íconos sin nombre accesible son decorativos (`aria-hidden`).
- **Redondeo**: a centavos con medio hacia arriba (18,092.415 → 18,092.42) para coincidir con los frames.
- **Mercado cerrado**: no hay reloj real; se fuerza con `?mercado=cerrado`.

## Pendiente (del handoff)

- Export del ícono custom de IA desde Figma (node 4345:745); placeholder `lightbulb-alt`.
- Paso "¿A quién le pagas?" para un destinatario nuevo.
- Entrada "Ayuda" para repetir el recorrido desde la UI.
- "Subir documento", "Comprobante", "Ver todas mis cuentas", "Horarios de operación", "Operaciones recientes" y "Agregar destinatario" no tienen destino en este alcance.
