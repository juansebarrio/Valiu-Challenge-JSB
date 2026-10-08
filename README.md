# Valiu · Challenge 1: flujo de pago en alta (importadora y minorista de turismo)

Rediseño del home de Valiu y del flujo "pagar una factura en dólares con pesos", recreado en Next.js a partir del handoff de diseño (`docs/handoff/`), más el segundo arquetipo del mismo challenge: una minorista de turismo que cobra en pesos y paga en euros (`docs/handoff-turismo/`). El challenge 2 ("alta de destinatarios con IA") no está en este prototipo; el alta de destinatario que sí hay es un formulario manual en memoria. Una importadora entra, el home le muestra que le faltan 1,000 USD para los pagos de la semana, paga la factura de Shenzhen Parts Co. desde su cuenta en pesos en una ventana de pago de dos columnas y vuelve al home con la posición resuelta. Incluye la rama de **fecha valor**, el **cotizador** en la tarjeta de tipo de cambio (la segunda puerta al mismo flujo de pago, empezando por el precio), los **pagos en divisas sin cuenta**, el **desglose** de cada fila de la posición, el **onboarding** de 3 pasos y, en Movimientos, el **detalle de cada fila** en el panel lateral y **cargar un pago** desde el "+".

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
| `/turismo` | Viajes Altavista (segundo arquetipo, S01–S08): el cobro en pesos de hoy paga en euros al hotel; la Cuenta EUR está en cero. "Usar para pagar" abre "¿Qué pagas con este cobro?", igual que en la importadora. |
| Menú lateral | Solo Inicio navega (C-52); Movimientos, Control de operaciones, Destinatarios y Monitoreo de divisas se ven deshabilitadas. La lista completa de movimientos se abre con "Ver todos los movimientos" como vista de Inicio, con "Volver al inicio" arriba. Debajo de las entradas, "Tus cuentas" (C-56): una fila por cuenta con el nombre, el saldo de la sesión y la máscara, que abre el panel lateral de cuentas con esa cuenta primero, y "Ver todas mis cuentas" al pie; con el menú colapsado, un ícono que abre el mismo panel. La campana abre las notificaciones derivadas del estado. |
| `/tablero/alta` | Frames 01–07, 03B–07B, Estados, C1–C4 (cotizador), O1–O4 (pagos en otras divisas), G1 (desglose de la posición), D1–D3 (detalle), A1–A4 (cargar un pago), S01–S08 (turismo, con S07H/S08H para la variante Hoy), N4–N6 (notificaciones, cuentas y alta de destinatario) y 17–19 (recorrido) a 1280 px, renderizados con los mismos componentes en estados fijos (`src/state/escenarios.ts`). `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros de `/importadora` y `/turismo`:

- `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado|otras-divisas` (base: faltante). `otras-divisas` suma al base un pago cargado en libras sin cuenta en libras (40,000.00 GBP a Thames Tooling Ltd. en la importadora, 4,000.00 GBP a London Hotels Group en turismo, los dos inventados), que paga la cuenta en pesos (C-54).
- `?congelar=1` fija el tipo de cambio indicativo (capturas y verificación).
- `?demo=1` habilita la tecla P y muestra un control flotante con "Vencer precio" (deja la cuenta en 0:05), "Ver recorrido" y "Reiniciar escenario".
- `?recorrido=0` apaga el onboarding.
- `?pago=<id>` abre la ventana de pago en Origen con ese pago cargado; `?cobro=<id>` entra desde el cobro de hoy (en turismo, al paso "¿Qué pagas con este cobro?").
- `?seccion=movimientos` abre la lista completa de movimientos (vista de Inicio); cualquier otro `?seccion=` cae en Inicio (C-52).

Estado en memoria: recargar reinicia el escenario (nada de localStorage). Solo escritorio: con menos de 1024 px el shell se oculta y queda solo el aviso, y el documento nunca tiene scroll horizontal (verificado a 1024, 1100, 1280 y 1440 px).

Teclado: **Esc** cierra la ventana de pago, el panel lateral o el recorrido (el clic en el fondo atenuado también cierra la ventana y el panel), y el foco vuelve al control que los abrió · **Tab** y **Shift+Tab** recorren la ventana de pago o el panel lateral con el foco atrapado; al abrir, el foco va al primer campo o a la opción elegida · **← →** (y **↑ ↓**) mueven la selección en la fecha valor y en las opciones de origen (las deshabilitadas se saltan) · **P** pausa el tipo de cambio en vivo y la cuenta regresiva, solo con `?demo=1` (sin ese parámetro no hace nada ni aparece "En pausa"; nunca se dispara con el foco en un campo) · **Enter** sobre el nombre de un movimiento abre su detalle (toda la fila responde al clic), y sobre una fila con cantidad de la posición ("Pagos futuros (3)"…) abre su desglose · en el cotizador, **Enter** abre el selector de par, **Tab** recorre sus opciones y **Esc** lo cierra · el token es un solo input de 6 dígitos (admite pegar) · el código `000000` simula un token incorrecto.

Movimientos: cada fila de Próximos y Realizados abre su detalle en el panel lateral (pendiente, pactado, en proceso o realizado), y "Pagar" en el detalle cierra el panel y abre la ventana de pago; "Comprobante" en Cobraste hoy abre el detalle del cobro, y "Descargar comprobante" descarga un .html con las mismas filas. En la revisión, "Concepto" y "Referencia" son opcionales. "Ver todos los movimientos", único control al pie del bloque, abre la lista completa como vista de Inicio (arranca arriba, con "Volver al inicio"): todos los pagos próximos con sus totales por divisa y todos los realizados, con "Cargar un pago" y "Pagar" en el encabezado. El "+" junto al título carga un pago nuevo en la ventana de pago (destinatario → monto, vencimiento, concepto y referencia → "Pago cargado") que queda en Próximos como pendiente y se paga con el flujo de siempre; no programa ninguna ejecución. Una pactada no se cancela desde el prototipo: su detalle dice que el precio ya está cerrado y que la cancelación se pide por WhatsApp desde Contáctanos.

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
  hooks/useDialogo.ts      foco inicial, foco atrapado, Esc y devolución del foco: lo comparten la ventana de pago y el panel lateral
  lib/dinero.ts            centavos, micro-unidades y redondeo half-up con BigInt
  lib/fx.ts                deducción de par, operación y lado; cotizar({...}); precio ejecutable; fechas de liquidación (+ tests)
  lib/format.ts            un formato por tipo de dato (fechas según C-44)
  lib/posicion.ts          posición por cuenta (cada pago cuenta contra la cuenta que lo paga, C-54), proyección de la semana, consecuencia de cada origen (+ tests)
  state/estado.ts          estado en memoria y reducer puro
  state/derivados.ts       cuentas, pagos pendientes, posiciones y proyecciones derivados del estado
  state/vistas.ts          selectores: del estado a los props de cada componente
  state/escenarios.ts      estados iniciales por escenario y los frames de /tablero/alta
  state/flujo.test.ts      el flujo completo, frame por frame, con los números del handoff
  components/              Arquetipos (pantalla inicial), AppShell, TarjetaPosicion (filas con desglose), FranjaNuevo, FilaMovimiento,
                           TarjetaTipoDeCambio (selector de par y cotizador), MenuCuentas (Tus cuentas en el menú),
                           CapaOperacion (elige el contenedor), ModalOperar (ventana de pago), ResumenPago (su columna derecha), PanelOperar (panel lateral),
                           OpcionOrigen (OpcionRadio, OpcionPago, GrupoRadio), BloqueMonto, FechaLiquidacion, CampoToken,
                           Confirmacion, DetalleMovimiento, DesglosePosicion, AgendarPago, SelectorDestino, AvisoResultado, PasoOnboarding,
                           AvisoPantalla, ControlDemo; ui/ (Boton, Badge, Alerta, Campo, ListaDetalle, Toast…)
docs/handoff/              el paquete de diseño tal como llegó: README, docs/, design-system/, prototipo/
docs/handoff-turismo/      el paquete del flujo secundario (README, componentes, decisiones D-30 a D-34, prototipo, datos)
docs/decisiones.md         correcciones aplicadas sobre el export, con el motivo
docs/diferencias-cc-vs-diseno.md  diferencias entre el código y el archivo de diseño del flujo secundario (el código manda)
docs/presentacion/         capturas para la presentación (capturas/README.md con tabla de archivo, frame o ruta y slide; capturas-deck.zip con las del deck)
docs/design/frames/        una captura por frame del export · docs/design/verificacion/ capturas de los recorridos de verificación (01–38 flujo principal y cotizador, A/M/V movimientos, B sección 7, P paneles y alta de destinatario, C52 el menú, C53-* cotizador, pagos en otras divisas y desglose a 1024 × 700 y 1280 × 800 en los dos arquetipos, T arquetipos y turismo, W-* inicio/ventana de pago/cotizador a 1024, 1100, 1280 y 1440 px, VP-* cada paso de la ventana de pago a 1024 × 700 en los dos arquetipos, C48-* precio en vivo, pago cargado, transferencia, pactada y movimientos a 1024 × 700 y 1280 × 800, F-* los frames de /tablero/alta con la ventana abierta)
```

Cada componente lleva `data-component="Nombre"` con el nombre del handoff.

### Design system

`src/styles/tokens.css` tiene dos capas: la copia literal de `design-system/colors_and_type.css` (solo se quitó el `@import` de Google Fonts: Montserrat se carga con `next/font`) y los alias semánticos `--app-*` con los valores verificados en Figma (`docs/handoff/design-system/tokens-figma.md`, precedencias en `docs/handoff/docs/design-system-uso.md`). `globals.css` reinicia el tema de Tailwind y lo mapea a esos alias: `bg-app-primary`, `text-app-ink-2`, `rounded-sm`, `shadow-mid`, `text-caption`, `h-(--app-header-h)`… Los componentes consumen solo esas clases; cuando el DS cambie se reemplaza la capa 1 y se ajustan los alias.

### Estado

Un `useReducer` con el estado mínimo del README del handoff: panel {abierto, tipo (pago | agendar | destinatario | depositar | detalle | notificaciones | cuentas | desglose), paso, orden, origen, fecha valor, precio {indicativo | ejecutable | vencido}, token, movimiento abierto, agenda, fila del desglose, entrada desde el cotizador, cuenta elegida en el menú}, cotizador {par, desplegado, sentido, montos, lado fijo}, onboarding, operaciones hechas (en proceso o pactadas), pagos cargados en la sesión, tipo de cambio en vivo y congelado. El reducer es puro y determinista, así que `/tablero/alta` construye cada frame aplicando acciones (`src/state/escenarios.ts`) y `flujo.test.ts` verifica frame por frame los montos del handoff (27,136.77 → 27,138.62 → 1,152,861.38, la pactada, la compra de 1,000 USD por 18,092.42 MXN, el cotizador, los pagos en otras divisas, el desglose, el detalle y el pago cargado).

Los selectores (`vistas.ts`) derivan todo lo demás: posiciones y proyección a partir de saldos y pagos pendientes, la consecuencia de cada cuenta de origen (`evaluarOrigen`), el home después de un pago enviado o pactado y la tarjeta de tipo de cambio con el cotizador.

## Decisiones de implementación

- **Tipo de cambio en vivo**: el indicativo de cada par oscila ±0.002 % cada 3–5 s; `?congelar=1` lo fija en los valores del brief. `/tablero/alta` siempre es estático.
- **Precio en vivo (C-48)**: "Pedir precio" abre por 2 minutos la conexión con el banco; mientras tanto el ejecutable sigue al indicativo en cada paso (`ejecutable(indicativo, lado)`), el lado del monto que eligió el usuario queda fijo y el otro se recalcula, y la operación guarda el precio y los montos del instante en que confirma ("Confirma en m:ss", Warning en los últimos 30 s). Durante los 800 ms de "Confirmando…" el precio no se mueve. Con `?congelar=1` y en `/tablero/alta`, 18.092415 y 27,138.62 quedan quietos.
- **Precio ejecutable**: indicativo × 1.0000681 cuando recibes la base (18.092415 para la compra de USD del brief) y × 0.9999319 cuando la entregas (`ejecutable()` en `fx.ts`).
- **Cuenta EUR como origen**: "Pagas ≈ 1,280.96 EUR" con el lado vender de EUR/USD (1.171000). EUR/USD es 1.175000 / 1.171000 en los dos arquetipos para que cierre con USD/MXN y EUR/MXN (sección 7 del brief).
- **Orden de las TarjetaPosicion**: USD, MXN, EUR, como en los frames (`ORDEN_POSICIONES` en el escenario).
- **"Pagar" del encabezado y "Pagar a otro destinatario"**: abren el paso Destino, construido con el selector del frame 14 (primero "Destinatarios" y después "Tus cuentas", C-49); se elige un destinatario, no un pago: si tiene un pago cargado pendiente, la revisión lo ofrece sobre el monto con "Usar este pago" (el que vence antes), que carga monto, concepto y referencia y lo vincula. Una cuenta propia en otra divisa es una compra o una venta por la misma ventana de pago, y el monto se escribe en la revisión ("Pagas" arriba y "Recibe" abajo, con y sin factura; el que escribes queda fijo). Pagar desde la cuenta de la misma divisa es una transferencia: un solo monto ("Envías"), sin tipo de cambio ni fecha valor, con el token al confirmar. "Agregar destinatario" abre el alta.
- **Comisión (C-50)**: una tasa por clase de operación (pago, compra, venta, transferencia) en puntos básicos enteros (`COMISIONES_BP` en `src/data/escenario.ts`, hoy 0 en todas); en la misma divisa la clase es transferencia. Pagas = lo que recibe convertido al precio × (1 + tasa), half-up. "Comisión 0%" se muestra siempre: columna derecha de la ventana, confirmación, comprobante y detalle; con tasa, "0.50% · 135.69 MXN" en la divisa de origen.
- **Arquetipos**: `/` elige la empresa; cada home recibe su `Arquetipo` (datos, tipo de cambio base, par de la decisión, orden de las tarjetas, pago principal y cómo entra desde el cobro). Nada se persiste: la ruta lleva el arquetipo y el recorrido se muestra una vez por arquetipo dentro de la sesión.
- **Segundo arquetipo (turismo)**: "Usar para pagar" abre, en los dos arquetipos, el paso "¿Qué pagas con este cobro?" (OpcionPago: cuánto del cobro usa cada pago y su consecuencia, el faltante preseleccionado, D-30); Continuar sigue la ventana de pago de siempre con la cuenta del cobro preseleccionada; la cuenta sin saldo en la divisa del pago se muestra deshabilitada ("Sin saldo", D-31); la divisa con faltante va primera y no se mueve (D-34). Las diferencias con el archivo de diseño están en `docs/diferencias-cc-vs-diseno.md`.
- **Secciones y paneles**: Control de operaciones, Destinatarios y Monitoreo de divisas quedan en el código como vistas del mismo `HomeApp` (`seccion` en el estado), sin entrada desde C-52; las notificaciones (`notificaciones()` en `derivados.ts`) y todas las cuentas viven en el panel lateral, y el alta de destinatario en la ventana de pago. Un destinatario nuevo se guarda en memoria con la máscara de su cuenta; desde el paso Destino, "Guardar y pagar" sigue con el pago. Una transferencia (misma divisa) con saldo insuficiente no se puede elegir ("No alcanza el saldo") ni continuar en la ventana de pago (en el cotizador, el error de saldo deshabilita Continuar); el reducer rechaza cualquier acción que deje un saldo negativo y `flujo.test.ts` recorre todos los pagos desde todas las cuentas en ambos arquetipos para comprobarlo.
- **Movimientos**: cada fila abre su detalle en el panel lateral (`abrirDetalle`) y su "Pagar" lo cierra y abre la ventana de pago; el "+" carga un pago en la ventana de pago (`abrirAgendar` → `agendar`) que se suma a `datos.pagosFuturos` y mueve la posición como cualquier pago cargado; una pactada no tiene acción de cancelar (su detalle remite a WhatsApp desde Contáctanos).
- **Cotizador (C-53)**: la tarjeta "Tipo de cambio" es la segunda puerta al flujo de pago, desde el precio (no hay más pestaña Operar clásico). Arriba, el selector de par con "Tus pares" (los de tus posiciones y tus pagos cargados) y "Otros pares" (el resto de `PARES`, con GBP/MXN y CAD/MXN operables); compra, venta y tendencia del par elegido y, debajo, los demás de "Tus pares". "Operar con este par" (desplegado al entrar, recordado durante la sesión en memoria) lleva "Recibes" y "Pagas" apilados: el lado que escribes queda fijo y el otro sigue al indicativo en vivo; invertir pide cuenta en la divisa que pagarías. Continuar abre la ventana de pago en Destino ("¿A dónde llegan los 10,000.00 USD?", tus cuentas en esa divisa y los destinatarios en esa divisa) y sigue Revisión, Precio y Confirmación sin Origen; la clase (compra, venta o pago) se deduce del destino. Las transferencias en la misma divisa siguen por "Pagar".
- **Pagos en otras divisas (C-54)**: un pago cargado cuenta contra la cuenta que lo va a pagar: la de su divisa o, si no la hay, la cuenta de fondeo del arquetipo (`cuentaFondeo`, pesos), convertido al indicativo de compra (`posicionesDe` en `posicion.ts`). La tarjeta suma "Pagos en otras divisas (n)" con "≈" y el resultado lleva "≈"; en Movimientos el pago va en su divisa con "≈ X MXN hoy"; en Origen la cuenta de fondeo viene preseleccionada y las cuentas sin par quedan deshabilitadas ("Sin par disponible"); pactado, entra exacto a "Pactadas por liquidar".
- **Desglose de la posición (C-55)**: las filas con cantidad de TarjetaPosicion son botones que abren su desglose en la ventana de pago angosta (`panel.tipo` desglose): los pagos o pactadas por fecha, con "Pagar" en los pendientes (sigue en la misma ventana; "Volver" en Origen regresa a la lista) y "Cerrar" al pie. El desglose va en la ventana porque desde ahí se paga; el detalle, las notificaciones y las cuentas siguen en el panel lateral.
- **Onboarding**: tres pasos (posición, movimientos y la tarjeta de tipo de cambio con el cotizador); aparece al entrar por primera vez al escenario base, no vuelve dentro de la sesión y sí al recargar (estado en memoria); `?recorrido=0` lo apaga y `?demo=1` lo repite desde "Ver recorrido". Mide el elemento objetivo en runtime (`getBoundingClientRect`) y funciona también escalado en `/tablero/alta`.
- **Ventana de pago y panel lateral (C-47)**: operar va en una ventana centrada (`ModalOperar`; desde C-56, a la derecha del menú cuando entra, con un shell de 1208 px o más) y consultar sigue en el panel lateral de 480 px (`PanelOperar`). La ventana lleva el pago (`tipo` pago), cargar un pago (agendar), el alta de destinatario y el desglose de la posición (C-55); el panel, el detalle de un movimiento, las notificaciones y todas las cuentas; los datos para depositar se muestran en el contenedor desde el que se pidieron (`CapaOperacion` decide). Origen, Revisión y Precio van en dos columnas a 920 px: a la izquierda lo que el usuario decide; a la derecha (`ResumenPago`, 368 px) lo que eso significa, con el tipo de cambio siempre arriba y en el mismo lugar, y el cuerpo con el mismo alto mínimo en los tres para que la ventana no cambie de alto. La confirmación también va en dos columnas (C-50): a la izquierda el estado, el BloqueMonto de solo lectura con los montos finales y el aviso; a la derecha "Sale de", "Sale el dinero", "Tipo de cambio", "Comisión", "Concepto" y "Referencia". Los pasos de una columna (Destino, "¿Qué pagas con este cobro?", Cargar un pago, Agregar destinatario, el desglose) van a 560 px; el cambio de ancho lleva una transición de 200 ms, sin animación con `prefers-reduced-motion` ni en los frames. Encabezado y pie quedan siempre visibles (botones a la derecha); si algo no entra en `100dvh − 48px`, scrollea solo el cuerpo. Las dos comparten `useDialogo` (role=dialog, aria-modal, foco inicial, foco atrapado, Esc, clic en el overlay y devolución del foco). En la app quedan fijas al viewport; en los frames son absolutas dentro del frame de 1280 px, y la ventana va centrada a la derecha del menú con un top fijo de 112 px.
- **Sidebar**: colapsa a 64 px (solo íconos, logo glyph) bajo 1100 px de ancho del shell con una container query, y "Tus cuentas" queda como un ícono (C-56); la grilla del home pasa a una columna bajo 900 px.
- **Botón Mid**: 32 px (14/24 + 4 16) como lo renderiza el prototipo; Large 36 y ExtraLarge 40 como el handoff.
- **Íconos**: `@iconscout/react-unicons` no publica tipos ni las variantes `angle-down-b` / `angle-up-b`; se declaran los tipos en `src/types/` y se usan `angle-down` / `angle-up`. Los íconos sin nombre accesible son decorativos (`aria-hidden`).
- **Redondeo**: a centavos con medio hacia arriba (18,092.415 → 18,092.42) para coincidir con los frames.
- **Mercado cerrado**: no hay reloj real ni horario confirmado; se fuerza con `?escenario=mercado-cerrado`.

## Pendiente

Del handoff:

- Export del ícono custom de IA desde Figma (node 4345:745); placeholder `lightbulb-alt`.
- Entrada "Ayuda" para repetir el recorrido desde la UI (hoy solo con `?demo=1`).
- "Subir documento" (no hay OCR ni factura real) y "Horarios de operación" (el horario es un dato sin confirmar) muestran "Esta sección no está en el prototipo".

De C-53 a C-55:

- GBP/MXN y CAD/MXN tienen precios de ejemplo (`ejemplo: true` en `PARES`) y tendencias inventadas (`TENDENCIAS` en `src/data/escenario.ts`), como los destinatarios en libras y en dólares canadienses: faltan los del proveedor.
- La cuenta de fondeo es un dato del arquetipo (`cuentaFondeo`, pesos en los dos); falta de dónde sale en el producto.
