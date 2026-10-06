# Valiu · Flujo principal de pago (challenge 1) y flujo secundario (challenge 2)

Rediseño del home de Valiu y del flujo "pagar una factura en dólares con pesos", recreado en Next.js a partir del handoff de diseño (`docs/handoff/`), más el flujo secundario de una minorista de turismo que cobra en pesos y paga en euros (`docs/handoff-turismo/`). Una importadora entra, el home le muestra que le faltan 1,000 USD para los pagos de la semana, paga la factura de Shenzhen Parts Co. desde su cuenta en pesos en un panel lateral y vuelve al home con la posición resuelta. Incluye la rama de **fecha valor**, la pestaña **Operar clásico**, el **onboarding** de 4 pasos y, en Movimientos, el **detalle de cada fila** en el panel lateral, **agendar un pago** desde el "+" y **cancelar un pago pactado**.

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
| `/` | Pantalla inicial: elegir con qué empresa de ejemplo se entra (tipo login de demo). Tab recorre los CTA, Enter entra; "Cerrar sesión" vuelve acá. |
| `/importadora` | Servicios Corporativos KAAX (flujo principal): faltan dólares para los pagos de la semana y se pagan con pesos. |
| `/turismo` | Viajes Altavista (flujo secundario, S01–S08): el cobro en pesos de hoy paga en euros al hotel; la Cuenta EUR está en cero. "Usar para pagar" abre "¿Qué pagas con este cobro?". |
| `/tablero/alta` | Frames 01–07, 03B–07B, Estados, 08–16, D1–D5 (detalle y cancelación), A1–A4 (agendar), S01–S08 (turismo, con S07H/S08H para la variante Hoy) y 17–20 a 1280 px, renderizados con los mismos componentes en estados fijos (`src/state/escenarios.ts`). `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros de `/importadora` y `/turismo`:

- `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado` (base: faltante).
- `?congelar=1` fija el tipo de cambio indicativo (capturas y verificación).
- `?demo=1` muestra un control flotante con "Vencer precio" (deja la cuenta en 0:05), "Ver recorrido" y "Reiniciar escenario".
- `?recorrido=0` apaga el onboarding.
- `?pago=<id>` abre el panel en Origen con ese pago cargado; `?cobro=<id>` entra desde el cobro de hoy (en turismo, al paso "¿Qué pagas con este cobro?").
- `?seccion=movimientos` abre la sección Movimientos del menú (la lista completa de próximos y realizados).

Estado en memoria: recargar reinicia el escenario (nada de localStorage). Solo escritorio: con menos de 1200 px el shell se oculta y queda solo el aviso, y el documento nunca tiene scroll horizontal.

Teclado: **Esc** cierra el panel o el recorrido · **P** pausa el tipo de cambio en vivo y la cuenta regresiva (demo) · **← →** mueven la selección en la fecha valor y en las opciones de origen (las deshabilitadas se saltan) · **Tab** recorre el panel con el foco atrapado · **Enter** sobre el nombre de un movimiento abre su detalle (toda la fila responde al clic) · el token es un solo input de 6 dígitos (admite pegar) · el código `000000` simula un token incorrecto.

Movimientos: cada fila de Próximos y Realizados abre su detalle en el panel (pendiente, pactado, en proceso, cancelado o realizado). "Ver más" al final del bloque (y "Movimientos" en el menú lateral) abre la sección completa: todos los pagos próximos con sus totales por divisa y todos los realizados, con "Agendar un pago" y "Pagar" en el encabezado. El "+" junto al título agenda un pago nuevo (destinatario → monto, vencimiento, motivo y referencia → confirmación) que entra a Próximos como pendiente y se paga con el flujo de siempre. Un pago pactado se cancela desde su detalle ("Cancelar pacto" → pregunta → "Cancelando…" 800 ms): el pago vuelve a Próximos y la pactada queda en Realizados como Cancelada.

## Estructura

```
src/
  styles/tokens.css        copia literal del DS oficial (colors_and_type.css) + alias --app-*
  app/globals.css          Tailwind mapeado a los alias (ningún hex ni medida suelta en componentes)
  app/                     / · /tablero · /sistema
  data/escenario.ts        tipos, constantes compartidas y la importadora como Arquetipo (cuentas, pagos, destinatarios, cobro, tipo de cambio)
  data/escenario-turismo.ts  Viajes Altavista con la misma forma (lo inventado marcado)
  data/arquetipos.ts       registro de las dos empresas de ejemplo
  hooks/useTdcEnVivo.ts    el indicativo en vivo (demo): un paso cada 3–5 s alrededor de la base; en producción, polling o socket
  lib/dinero.ts            centavos, micro-unidades y redondeo half-up con BigInt
  lib/fx.ts                deducción de par, operación y lado; cotizar({...}); precio ejecutable; fechas de liquidación (+ tests)
  lib/format.ts            un formato por tipo de dato (D-10)
  lib/posicion.ts          posición por divisa, proyección de la semana, consecuencia de cada origen (+ tests)
  state/estado.ts          estado en memoria y reducer puro
  state/derivados.ts       cuentas, pagos pendientes, posiciones y proyecciones derivados del estado
  state/vistas.ts          selectores: del estado a los props de cada componente
  state/escenarios.ts      estados iniciales por escenario y los frames de /tablero/alta
  state/flujo.test.ts      el flujo completo, frame por frame, con los números del handoff
  components/              Arquetipos (pantalla inicial), AppShell, TarjetaPosicion, FranjaNuevo, FilaMovimiento, TarjetaTipoDeCambio, ModuloCuentas,
                           PanelOperar, OpcionOrigen (OpcionRadio, OpcionPago, GrupoRadio), BloqueMonto, FechaLiquidacion, PrecioEjecutable, CampoToken,
                           Confirmacion, DetalleMovimiento, AgendarPago, SelectorDestino, AvisoResultado, PasoOnboarding,
                           FormularioOperar (SelectorPar, CampoMontoDoble, Cotizacion, CajaTdcValiu), AvisoVistaAnterior,
                           AvisoPantalla, ControlDemo; ui/ (Boton, Badge, Alerta, Campo, ListaDetalle, Toast…)
docs/handoff/              el paquete de diseño tal como llegó: README, docs/, design-system/, prototipo/
docs/handoff-turismo/      el paquete del flujo secundario (README, componentes, decisiones D-30 a D-34, prototipo, datos)
docs/decisiones.md         correcciones aplicadas sobre el export, con el motivo
docs/diferencias-cc-vs-diseno.md  diferencias entre el código y el archivo de diseño del flujo secundario (el código manda)
docs/design/frames/        una captura por frame del export · docs/design/verificacion/ capturas del recorrido de verificación
```

Cada componente lleva `data-component="Nombre"` con el nombre del handoff.

### Design system

`src/styles/tokens.css` tiene dos capas: la copia literal de `design-system/colors_and_type.css` (solo se quitó el `@import` de Google Fonts: Montserrat se carga con `next/font`) y los alias semánticos `--app-*` con los valores verificados en Figma (`docs/handoff/design-system/tokens-figma.md`, precedencias en `docs/handoff/docs/design-system-uso.md`). `globals.css` reinicia el tema de Tailwind y lo mapea a esos alias: `bg-app-primary`, `text-app-ink-2`, `rounded-sm`, `shadow-mid`, `text-caption`, `h-(--app-header-h)`… Los componentes consumen solo esas clases; cuando el DS cambie se reemplaza la capa 1 y se ajustan los alias.

### Estado

Un `useReducer` con el estado mínimo del README del handoff: pestaña, panel {abierto, tipo (pago | depositar | detalle | agendar), paso, orden, origen, fecha valor, precio {indicativo | fijo | vencido}, token, movimiento abierto, agenda}, onboarding, formulario de Operar, operaciones hechas (en proceso, pactadas o canceladas), pagos agendados, tipo de cambio en vivo y congelado. El reducer es puro y determinista, así que `/tablero/alta` construye cada frame aplicando acciones (`src/state/escenarios.ts`) y `flujo.test.ts` verifica frame por frame los montos del handoff (27,136.77 → 27,138.62 → 1,152,861.38, la pactada, 18,092.42 en Operar, el error de saldo, el detalle, la cancelación y el pago agendado).

Los selectores (`vistas.ts`) derivan todo lo demás: posiciones y proyección a partir de saldos y pagos pendientes, la consecuencia de cada cuenta de origen (`evaluarOrigen`), el home después de un pago enviado o pactado, el formulario de Operar con precio indicativo, fijo o vencido.

## Decisiones de implementación

- **Tipo de cambio en vivo**: el indicativo de cada par oscila ±0.002 % cada 3–5 s; `?congelar=1` lo fija en los valores del brief. El precio fijo no oscila: es el ejecutable al momento de pedirlo. `/tablero/alta` siempre es estático.
- **Precio ejecutable**: indicativo × 1.0000681 cuando recibes la base (18.092415 para la compra de USD del brief) y × 0.9999319 cuando la entregas (`ejecutable()` en `fx.ts`).
- **Cuenta EUR como origen**: "Pagas ≈ 1,388.89 EUR" con el lado vender de EUR/USD (1.080000), valores del handoff.
- **Orden de las TarjetaPosicion**: USD, MXN, EUR, como en los frames (`ORDEN_POSICIONES` en el escenario).
- **"Pagar" del encabezado**: abre el paso Destino, construido con el selector del frame 14 (grupos "Pagos próximos", "Tus cuentas" y "Destinatarios"); "Agregar destinatario" avisa que no está en el prototipo.
- **Arquetipos**: `/` elige la empresa; cada home recibe su `Arquetipo` (datos, tipo de cambio base, par de la decisión, orden de las tarjetas, pago principal y cómo entra desde el cobro). Nada se persiste: la ruta lleva el arquetipo y el recorrido se muestra una vez por arquetipo dentro de la sesión.
- **Flujo secundario (turismo)**: "Usar para pagar" abre el paso "¿Qué pagas con este cobro?" (OpcionPago: cuánto del cobro usa cada pago y su consecuencia, el faltante preseleccionado, D-30); Continuar sigue el panel de siempre con la cuenta del cobro preseleccionada; la cuenta sin saldo en la divisa del pago se muestra deshabilitada ("Sin saldo", D-31); la divisa con faltante va primera y no se mueve (D-34). Las diferencias con el archivo de diseño están en `docs/diferencias-cc-vs-diseno.md`.
- **Movimientos**: cada fila abre su detalle en el mismo panel (`abrirDetalle`); el "+" agenda un pago (`abrirAgendar` → `agendar`) que se suma a `datos.pagosFuturos` y mueve la posición como cualquier pago cargado; una pactada se cancela desde el detalle (`cancelarPactada` → `confirmarCancelacion` → `pactadaCancelada`) y queda en el historial como Cancelada sin tocar saldos.
- **Onboarding**: aparece al entrar por primera vez al escenario base, no vuelve dentro de la sesión y sí al recargar (estado en memoria); `?recorrido=0` lo apaga y `?demo=1` lo repite desde "Ver recorrido". Mide el elemento objetivo en runtime (`getBoundingClientRect`) y funciona también escalado en `/tablero/alta`.
- **Panel**: en la app queda fijo al viewport (overlay, foco inicial, Esc, devuelve el foco al cerrar); en los frames es absoluto dentro del frame de 1280 px.
- **Sidebar**: colapsa a 64 px (solo íconos, logo glyph) bajo 1100 px de ancho del shell con una container query; la grilla del home pasa a una columna bajo 900 px.
- **Botón Mid**: 32 px (14/24 + 4 16) como lo renderiza el prototipo; Large 36 y ExtraLarge 40 como el handoff.
- **Íconos**: `@iconscout/react-unicons` no publica tipos ni las variantes `angle-down-b` / `angle-up-b`; se declaran los tipos en `src/types/` y se usan `angle-down` / `angle-up`. Los íconos sin nombre accesible son decorativos (`aria-hidden`).
- **Redondeo**: a centavos con medio hacia arriba (18,092.415 → 18,092.42) para coincidir con los frames.
- **Mercado cerrado**: no hay reloj real ni horario confirmado; se fuerza con `?escenario=mercado-cerrado`.

## Pendiente (del handoff)

- Export del ícono custom de IA desde Figma (node 4345:745); placeholder `lightbulb-alt`.
- Alta de un destinatario nuevo ("Agregar destinatario" y "Pagar a otro destinatario" del paso con el cobro).
- Entrada "Ayuda" para repetir el recorrido desde la UI (hoy solo con `?demo=1`).
- "Subir documento", "Comprobante", "Descargar comprobante", "Ver todas mis cuentas", "Horarios de operación", "Operaciones recientes" y las secciones del menú muestran "Esta sección no está en el prototipo".
