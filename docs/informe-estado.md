# Informe de estado · Prototipo Valiu (challenge 1 y 2)

Fecha: 6 de octubre de 2026. Producción: https://valiu-challenge.vercel.app (URLs `.vercel.app` con protección SSO de Vercel). Repositorio: `juansebarrio/Valiu-Challenge-JSB`, PR #1 (`claude/determined-thompson-n0zgns` → `main`) con todo el trabajo; PR #2 (`feat/flujo-turismo`) ya incluido en esa rama.

## 1. Qué es el producto hoy

Prototipo navegable en Next.js del home rediseñado de Valiu y de su flujo de pago, con dos empresas de ejemplo:

- **Servicios Corporativos KAAX** (importadora, flujo principal): le faltan 1,000.00 USD para los pagos de la semana y paga la factura de Shenzhen Parts Co. con pesos.
- **Viajes Altavista** (turismo, flujo secundario): cobra 95,000.00 MXN de Familia Ortega, la Cuenta EUR está en cero y paga 4,200.00 EUR al Hotel Gran Vía Madrid el viernes.

Todo corre en el navegador, con estado en memoria (recargar reinicia el escenario) y una fecha fija (martes 6 de octubre de 2026, 10:42 CDMX) cuyo reloj avanza con el tiempo real. Solo escritorio: por debajo de 1200 px queda un aviso.

### Rutas

| Ruta | Contenido |
|---|---|
| `/` | Pantalla inicial: elegir con qué empresa se entra (dos tarjetas con contexto, Tab/Enter). |
| `/importadora` | Home del flujo principal. |
| `/turismo` | Home del flujo secundario. |
| `/tablero/alta` | Todos los frames (01–07, 03B–07B, Estados, 08–16, D1–D5, A1–A4, S01–S08 con S07H/S08H, 17–20) renderizados desde el estado del reducer a 1280 px. `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros: `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado`, `?congelar=1` (tipo de cambio fijo), `?demo=1` (vencer precio, ver recorrido, reiniciar), `?recorrido=0`, `?pago=<id>`, `?cobro=<id>`, `?seccion=movimientos`. Tecla P: pausa el indicativo y la cuenta regresiva (nunca desde un campo).

## 2. Qué se desarrolló, en orden

### Etapa 1 · Flujo principal desde el handoff de diseño
- Proyecto Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4 mapeado a los tokens del DS (`src/styles/tokens.css` = copia literal del DS oficial + alias `--app-*`), Montserrat con `next/font`, Unicons. Sin librerías de componentes de terceros.
- Home: posición por divisa con proyección de la semana (línea de cero, punto de faltante), lo nuevo, movimientos, tipo de cambio, cuentas. Panel lateral de pago con pasos origen → revisión → precio y token → confirmación. Fecha valor. Onboarding de 4 pasos. Pestaña Operar clásico.
- Deploy en Vercel y PR inicial.

### Etapa 2 · "Flujo principal en alta"
- Motor de dinero en centavos y tipo de cambio en millonésimas (BigInt, redondeo half-up), `cotizar()` único, precio ejecutable con spread y vencimiento (2:00), posición = saldo + pactadas por recibir − pagos pendientes − pactadas por liquidar.
- Datos fijos del brief (3 pagos USD, 7 pagos MXN que suman 80,350.50, cobro de +180,000), escenarios por URL, paso Destino, cinco entradas al panel, chips de consecuencia calculados, Hoy deshabilitado cuando no alcanza, cuenta regresiva con aria-live, token de un solo input, estado vencido, pactadas y fondeo, modo demo, aviso de pantalla mínima, toasts para lo que no está en el prototipo.
- Tablero `/tablero/alta` generado desde el estado, hoja de estados, `/sistema`, verificación con Playwright y capturas, `docs/decisiones.md` (C-01 a C-24).

### Etapa 3 · Movimientos
- Detalle de cada fila en el panel (pendiente, pactado, en proceso, cancelado, cobro, pago realizado).
- "+" junto a Movimientos: agendar un pago (destinatario → monto, vencimiento en día hábil, concepto, referencia → confirmación con "Pagar ahora"); el pago entra a Próximos y a la posición.
- Cancelar un pago pactado desde su detalle (pregunta, "Cancelando…", vuelve a Próximos, queda en Realizados como Cancelada).

### Etapa 4 · Flujo secundario (turismo) y pantalla inicial
- Tipo `Arquetipo` (empresa, usuario, datos, tipo de cambio, par de la decisión, orden de tarjetas, pago principal, entrada desde el cobro); escenario turismo con la misma forma que la importadora.
- Pantalla inicial `/` y rutas `/importadora` y `/turismo`; "Cerrar sesión" vuelve a `/`; recorrido una vez por arquetipo.
- Paso "¿Qué pagas con este cobro?" (OpcionPago, misma anatomía que OpcionOrigen vía `OpcionRadio` + `GrupoRadio`), OpcionOrigen deshabilitada "Sin saldo", tarjeta de tipo de cambio con el par de la decisión primero, TarjetaPosicion con saldo 0 y sin pendientes, hook `useTdcEnVivo`, tecla P.
- `docs/diferencias-cc-vs-diseno.md` (el código manda; lista para sincronizar el archivo de diseño), frames S01–S08 capturados del prototipo.

### Etapa 5 · Sección Movimientos y scroll horizontal
- "Ver más" (Secondary) al final de Movimientos y la entrada del menú abren la sección completa (todos los próximos con totales por divisa, todos los realizados, "Agendar un pago" y "Pagar").
- Sin scroll horizontal del documento en ningún ancho: `overflow-x: hidden`, pie que envuelve, tarjetas de la pantalla inicial fluidas, shell oculto bajo 1200 px.

### Etapa 6 · Sección 7 del brief
1. Transferencia por el mismo panel: origen en la divisa del pago → sin tipo de cambio, sin "Pedir precio", sin fecha valor, token al confirmar (Shenzhen desde Cuenta USD; Mayorista Caribe desde Cuenta USD).
2. Paso Destino "¿A quién le pagas?" para el "Pagar" del encabezado y para "Pagar a otro destinatario" (desde el cobro, con "Volver"); una cuenta propia en otra divisa es compra o venta por el mismo panel, y desde Origen se continúa sin monto.
3. Lado fijo del monto sin factura: "Recibe" y "Pagas" editables, el que se escribe queda fijo y el otro se recalcula en vivo.
4. EUR/USD a 1.175000 / 1.171000 en los dos arquetipos: Shenzhen desde EUR ≈ 1,280.96 EUR; Hotel desde USD ≈ 4,935.00 USD (faltarían 1,435.00 USD el jue 8). Tests, escenarios y muestras de `/sistema` recalculados desde `fx.ts`.
5. Tecla P: nunca se dispara con el foco en un campo.
6. "Concepto" opcional en lugar de "Motivo de pago" (panel y Agendar; el clásico conserva "Motivo de pago"); "Comprobante" de Lo nuevo abre el detalle del cobro y las descargas de comprobante generan un .html real. Los estados de token incorrecto, origen sin saldo y pactada sin saldo quedaron como estaban.

## 3. Estado actual por área

### Flujos que funcionan de punta a punta
- Pago de un pago cargado con tipo de cambio (compra), hoy o con fecha valor (pactada), con precio fijo de 2:00, vencimiento y token (000000 simula error).
- Pago desde la cuenta de la misma divisa (transferencia sin TDC).
- Compra o venta a cuenta propia desde "Comprar X", desde el "Pagar" del encabezado o desde "Pagar a otro destinatario", con montos "Recibe" / "Pagas" editables.
- Entrada desde el cobro ("Usar para pagar"): en turismo, paso "¿Qué pagas con este cobro?"; en la importadora, paso Destino.
- Detalle de movimientos, agendar pagos, cancelar pactadas, comprobantes descargables, sección Movimientos.
- Operar clásico (Comprar, Vender, Transferir) con el mismo motor, aviso de par sin prototipo, mercado cerrado por escenario.
- Onboarding, modo demo, escenarios por URL, TDC en vivo con pausa.

### Motor y datos
- `src/lib/dinero.ts`, `fx.ts`, `posicion.ts`, `format.ts`: todo el cálculo; ningún monto escrito a mano en componentes.
- `src/data/escenario.ts` (importadora), `escenario-turismo.ts`, `arquetipos.ts`: datos ficticios marcados.
- `src/state/estado.ts` (reducer puro), `derivados.ts`, `vistas.ts` (selectores), `escenarios.ts` (escenarios y frames).

### Calidad
- 106 tests de Vitest (motor, posición y el flujo frame por frame con los números del brief), `npm run lint`, `tsc --noEmit` y `next build` limpios.
- Recorridos con Playwright del flujo principal, movimientos, arquetipos, turismo y sección 7 con cero errores de consola; capturas en `docs/design/verificacion/` y de los prototipos en `docs/design/frames/`.
- Accesibilidad: diálogo con foco atrapado y Esc, radiogroups con flechas (saltan deshabilitadas), cuenta regresiva con aria-live, estados siempre en badge con texto, foco visible, es-MX con tuteo.

### Documentación
- `README.md` (cómo correr, rutas, parámetros, estructura, decisiones), `docs/decisiones.md` (C-01 a C-29), `docs/diferencias-cc-vs-diseno.md` (turismo y sección 7), `docs/handoff/` y `docs/handoff-turismo/` (paquetes de diseño tal como llegaron).

## 4. Pendiente y límites conocidos

- Alta de destinatario nuevo ("Agregar destinatario" muestra el toast).
- Secciones del menú distintas de Inicio y Movimientos (Control de operaciones, Destinatarios, Monitoreo de divisas), notificaciones, "Subir documento", "Ver todas mis cuentas", "Horarios de operación" y "Operaciones recientes": toast.
- Pago en la misma divisa con saldo insuficiente pero mayor a cero: el panel muestra "Hoy no alcanza" y deja continuar sin fecha valor (estado que se dejó como estaba por pedido).
- Errores de red o de precio, reintentos de token, horario real de mercado, pago parcial o múltiple, pagos MXN dentro de la semana en la gráfica, persistencia entre recargas, móvil: fuera del alcance actual.
- Diferencias con el archivo de diseño del flujo secundario (precio ejecutable por factor, banda del TDC, tarjeta de tipo de cambio compacta, copys del panel, orden de OpcionPago): registradas en `docs/diferencias-cc-vs-diseno.md`, el código manda.
- Vercel: producción sigue atada a la rama `claude/determined-thompson-n0zgns`; al mergear a `main` conviene cambiar la rama de producción. Las URLs `.vercel.app` tienen protección SSO.
