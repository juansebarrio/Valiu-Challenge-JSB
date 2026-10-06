# Informe de estado · Prototipo Valiu (challenge 1, dos arquetipos)

Fecha: 6 de octubre de 2026. Producción: https://valiu-challenge.vercel.app (URLs `.vercel.app` con protección SSO de Vercel). Repositorio: `juansebarrio/Valiu-Challenge-JSB`, PR #1 (`claude/determined-thompson-n0zgns` → `main`) con todo el trabajo; PR #2 (`feat/flujo-turismo`) ya incluido en esa rama.

## 1. Qué es el producto hoy

Prototipo navegable en Next.js del home rediseñado de Valiu y de su flujo de pago (challenge 1), con sus dos arquetipos como empresas de ejemplo. El challenge 2 ("alta de destinatarios con IA") no está en este prototipo.

- **Servicios Corporativos KAAX** (importadora, flujo principal): le faltan 1,000.00 USD para los pagos de la semana y paga la factura de Shenzhen Parts Co. con pesos.
- **Viajes Altavista** (minorista de turismo, segundo arquetipo): cobra 95,000.00 MXN de Familia Ortega, la Cuenta EUR está en cero y paga 4,200.00 EUR al Hotel Gran Vía Madrid el viernes.

Todo corre en el navegador, con estado en memoria (recargar reinicia el escenario) y una fecha fija (martes 6 de octubre de 2026, 10:42 CDMX) cuyo reloj avanza con el tiempo real. Solo escritorio: por debajo de 1024 px queda un aviso.

### Rutas

| Ruta | Contenido |
|---|---|
| `/` | Pantalla inicial: elegir con qué empresa se entra (dos tarjetas con contexto, Tab/Enter). |
| `/importadora` | Home del flujo principal. |
| `/turismo` | Home del segundo arquetipo (minorista de turismo). |
| `/tablero/alta` | Todos los frames (01–07, 03B–07B, Estados, 08–16, D1–D5, A1–A4, S01–S08 con S07H/S08H, N1–N6, 17–20) renderizados desde el estado del reducer a 1280 px. `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros: `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado`, `?congelar=1` (tipo de cambio fijo), `?demo=1` (vencer precio, ver recorrido, reiniciar), `?recorrido=0`, `?pago=<id>`, `?cobro=<id>`, `?seccion=movimientos|control|destinatarios|monitoreo`. Tecla P: pausa el indicativo y la cuenta regresiva, solo con `?demo=1` (nunca desde un campo).

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
- Detalle de cada fila en el panel (pendiente, pactado, en proceso, cobro, pago realizado).
- "+" junto a Movimientos: cargar un pago (destinatario → monto, vencimiento en día hábil, concepto, referencia → "Pago cargado" con "Pagar ahora"); el pago queda en Próximos y cuenta en la posición. Antes se llamaba "Agendar un pago".
- Cancelar un pago pactado desde su detalle: construido y luego revertido (C-27); el detalle de una pactada dice que el precio ya está cerrado y remite a WhatsApp desde Contáctanos.

### Etapa 4 · Segundo arquetipo (turismo) y pantalla inicial
- Tipo `Arquetipo` (empresa, usuario, datos, tipo de cambio, par de la decisión, orden de tarjetas, pago principal, entrada desde el cobro); escenario turismo con la misma forma que la importadora.
- Pantalla inicial `/` y rutas `/importadora` y `/turismo`; "Cerrar sesión" vuelve a `/`; recorrido una vez por arquetipo.
- Paso "¿Qué pagas con este cobro?" (OpcionPago, misma anatomía que OpcionOrigen vía `OpcionRadio` + `GrupoRadio`), OpcionOrigen deshabilitada "Sin saldo", tarjeta de tipo de cambio con el par de la decisión primero, TarjetaPosicion con saldo 0 y sin pendientes, hook `useTdcEnVivo`, tecla P.
- `docs/diferencias-cc-vs-diseno.md` (el código manda; lista para sincronizar el archivo de diseño), frames S01–S08 capturados del prototipo.

### Etapa 5 · Sección Movimientos y scroll horizontal
- "Ver más" (Secondary, hoy "Ver todos los movimientos") al final de Movimientos y la entrada del menú abren la sección completa (todos los próximos con totales por divisa, todos los realizados, "Cargar un pago" y "Pagar").
- Sin scroll horizontal del documento en ningún ancho: `overflow-x: hidden`, pie que envuelve, tarjetas de la pantalla inicial fluidas, shell oculto bajo el ancho mínimo (hoy 1024 px).

### Etapa 6 · Sección 7 del brief
1. Transferencia por el mismo panel: origen en la divisa del pago → sin tipo de cambio, sin "Pedir precio", sin fecha valor, token al confirmar (Shenzhen desde Cuenta USD; Mayorista Caribe desde Cuenta USD).
2. Paso Destino "¿A quién le pagas?" para el "Pagar" del encabezado y para "Pagar a otro destinatario" (desde el cobro, con "Volver"); una cuenta propia en otra divisa es compra o venta por el mismo panel, y desde Origen se continúa sin monto.
3. Lado fijo del monto sin factura: "Pagas" y "Recibe" editables, el que se escribe queda fijo y el otro se recalcula en vivo.
4. EUR/USD a 1.175000 / 1.171000 en los dos arquetipos: Shenzhen desde EUR ≈ 1,280.96 EUR; Hotel desde USD ≈ 4,935.00 USD (faltarían 1,435.00 USD el jue 8). Tests, escenarios y muestras de `/sistema` recalculados desde `fx.ts`.
5. Tecla P: nunca se dispara con el foco en un campo (y desde la etapa 8, solo con `?demo=1`).
6. "Concepto" opcional en lugar de "Motivo de pago" (panel y Cargar un pago; el clásico conserva "Motivo de pago"); "Comprobante" de Lo nuevo abre el detalle del cobro y las descargas de comprobante generan un .html real. Los estados de token incorrecto, origen sin saldo y pactada sin saldo quedaron como estaban.

### Etapa 7 · Pendientes del prototipo
- Alta de destinatario ("Agregar destinatario" en el paso Destino, en Destinatarios y en el clásico): nombre, divisa, banco y cuenta o CLABE; desde el paso Destino, "Guardar y pagar" sigue con el pago.
- Secciones del menú como vistas reales: Control de operaciones (pactadas, en proceso y realizadas, con detalle), Destinatarios (cuenta, pendientes, "Pagar" sin monto) y Monitoreo de divisas (pares con sus dos lados, el ejecutable y la tendencia). "Operaciones recientes" del clásico lleva a Control.
- Campana con notificaciones derivadas del estado; "Ver todas mis cuentas" abre el panel de cuentas con CLABE, "Pasar dinero" y "Ver datos para depositar".
- Transferencia con saldo insuficiente: la cuenta queda deshabilitada ("No alcanza el saldo") y la revisión bloquea si el monto escrito supera el saldo.
- `?seccion=control|destinatarios|monitoreo`; frames N1–N6 en `/tablero/alta`.

### Etapa 8 · Ajustes de cierre (C-35 a C-44)
1. Sin "Cancelar pacto": el detalle de una pactada remite a WhatsApp desde Contáctanos; se eliminaron el flujo, sus acciones, tests y frames D4–D5 (C-27 revertida).
2. "Agendar un pago" pasa a "Cargar un pago" en toda la interfaz, frames A1–A4 y docs; la confirmación es "Pago cargado · Queda en Próximos para que lo pagues cuando quieras.".
3. Ningún recorrido deja saldo negativo: misma regla de "No alcanza el saldo" en Origen y en Transferir del clásico, guardias en el reducer y un test que recorre todos los pagos desde todas las cuentas en ambos arquetipos.
4. "Usar para pagar" abre "¿Qué pagas con este cobro?" también en la importadora.
5. Bloque de montos siempre "Pagas" arriba y "Recibe" abajo.
6. Un solo control al pie de Movimientos: "Ver todos los movimientos".
7. Tecla P solo con `?demo=1`.
8. Pantalla mínima 1024 px, verificada a 1024, 1100, 1280 y 1440 px.
9. Unidad del tipo de cambio "MXN por USD", "MXN por EUR", "USD por EUR".
10. Textos: turismo es el segundo arquetipo del challenge 1; el challenge 2 no está en el prototipo.
11. `docs/decisiones.md`: C-13 reemplaza a D-13 y C-44 documenta la regla de fechas que reemplaza a D-10.

## 3. Estado actual por área

### Flujos que funcionan de punta a punta
- Pago de un pago cargado con tipo de cambio (compra), hoy o con fecha valor (pactada), con precio fijo de 2:00, vencimiento y token (000000 simula error).
- Pago desde la cuenta de la misma divisa (transferencia sin TDC).
- Compra o venta a cuenta propia desde "Comprar X", desde el "Pagar" del encabezado o desde "Pagar a otro destinatario", con montos "Recibe" / "Pagas" editables.
- Entrada desde el cobro ("Usar para pagar"): paso "¿Qué pagas con este cobro?" en los dos arquetipos.
- Detalle de movimientos, cargar pagos, comprobantes descargables, sección Movimientos, Control de operaciones, Destinatarios (con alta), Monitoreo de divisas, notificaciones y panel de cuentas.
- Operar clásico (Comprar, Vender, Transferir) con el mismo motor, aviso de par sin prototipo, mercado cerrado por escenario.
- Onboarding, modo demo (con la tecla P), escenarios por URL, TDC en vivo.

### Motor y datos
- `src/lib/dinero.ts`, `fx.ts`, `posicion.ts`, `format.ts`: todo el cálculo; ningún monto escrito a mano en componentes.
- `src/data/escenario.ts` (importadora), `escenario-turismo.ts`, `arquetipos.ts`: datos ficticios marcados.
- `src/state/estado.ts` (reducer puro), `derivados.ts`, `vistas.ts` (selectores), `escenarios.ts` (escenarios y frames).

### Calidad
- 112 tests de Vitest (motor, posición y el flujo frame por frame con los números del brief), `npm run lint`, `tsc --noEmit` y `next build` limpios.
- Recorridos con Playwright del flujo principal, movimientos, arquetipos, turismo y sección 7 con cero errores de consola; capturas en `docs/design/verificacion/` y de los prototipos en `docs/design/frames/`.
- Accesibilidad: diálogo con foco atrapado y Esc, radiogroups con flechas (saltan deshabilitadas), cuenta regresiva con aria-live, estados siempre en badge con texto, foco visible, es-MX con tuteo.

### Documentación
- `README.md` (cómo correr, rutas, parámetros, estructura, decisiones), `docs/decisiones.md` (C-01 a C-34), `docs/diferencias-cc-vs-diseno.md` (turismo y sección 7), `docs/handoff/` y `docs/handoff-turismo/` (paquetes de diseño tal como llegaron).

## 4. Pendiente y límites conocidos

- "Subir documento" (no hay OCR ni factura real) y "Horarios de operación" (el horario es un dato sin confirmar): toast.
- El alta de destinatario no valida contra el banco y vive en memoria, como todo el estado.
- Errores de red o de precio, reintentos de token, horario real de mercado, pago parcial o múltiple, pagos MXN dentro de la semana en la gráfica, persistencia entre recargas, móvil: fuera del alcance actual.
- Diferencias con el archivo de diseño del flujo secundario (precio ejecutable por factor, banda del TDC, tarjeta de tipo de cambio compacta, copys del panel, orden de OpcionPago): registradas en `docs/diferencias-cc-vs-diseno.md`, el código manda.
- Vercel: producción sigue atada a la rama `claude/determined-thompson-n0zgns`; al mergear a `main` conviene cambiar la rama de producción. Las URLs `.vercel.app` tienen protección SSO.
