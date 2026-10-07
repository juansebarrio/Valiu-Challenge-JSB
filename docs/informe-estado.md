# Informe de estado · Prototipo Valiu (challenge 1, dos arquetipos)

Fecha: 7 de octubre de 2026. Producción: https://valiu-challenge.vercel.app (URLs `.vercel.app` con protección SSO de Vercel). Repositorio: `juansebarrio/Valiu-Challenge-JSB`, PR #1 (`claude/determined-thompson-n0zgns` → `main`) con todo el trabajo; PR #2 (`feat/flujo-turismo`) ya incluido en esa rama.

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
| `/tablero/alta` | Todos los frames (01–07, 03B–07B, Estados, 08–16, D1–D3, A1–A4, S01–S08 con S07H/S08H, N4–N6, 17–20) renderizados desde el estado del reducer a 1280 px. `/tablero` redirige acá. |
| `/sistema` | Guía viva: tokens del design system y cada componente en sus estados. |

Parámetros: `?escenario=faltante|resuelta|pactada|sin-saldo|mercado-cerrado`, `?congelar=1` (tipo de cambio fijo), `?demo=1` (vencer precio, ver recorrido, reiniciar), `?recorrido=0`, `?pago=<id>`, `?cobro=<id>`, `?seccion=movimientos` (cualquier otra sección cae en Inicio, C-52). Tecla P: pausa el indicativo y la cuenta regresiva, solo con `?demo=1` (nunca desde un campo).

## 2. Qué se desarrolló, en orden

### Etapa 1 · Flujo principal desde el handoff de diseño
- Proyecto Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4 mapeado a los tokens del DS (`src/styles/tokens.css` = copia literal del DS oficial + alias `--app-*`), Montserrat con `next/font`, Unicons. Sin librerías de componentes de terceros.
- Home: posición por divisa con proyección de la semana (línea de cero, punto de faltante), lo nuevo, movimientos, tipo de cambio, cuentas. Flujo de pago con pasos origen → revisión → precio y token → confirmación (en un panel lateral hasta C-47; hoy en una ventana de pago centrada de dos columnas). Fecha valor. Onboarding de 4 pasos. Pestaña Operar clásico.
- Deploy en Vercel y PR inicial.

### Etapa 2 · "Flujo principal en alta"
- Motor de dinero en centavos y tipo de cambio en millonésimas (BigInt, redondeo half-up), `cotizar()` único, precio ejecutable con spread y vencimiento (2:00), posición = saldo + pactadas por recibir − pagos pendientes − pactadas por liquidar.
- Datos fijos del brief (3 pagos USD, 7 pagos MXN que suman 80,350.50, cobro de +180,000), escenarios por URL, paso Destino, cinco entradas a la ventana de pago, chips de consecuencia calculados, Hoy deshabilitado cuando no alcanza, cuenta regresiva con aria-live, token de un solo input, estado vencido, pactadas y fondeo, modo demo, aviso de pantalla mínima, toasts para lo que no está en el prototipo.
- Tablero `/tablero/alta` generado desde el estado, hoja de estados, `/sistema`, verificación con Playwright y capturas, `docs/decisiones.md` (C-01 a C-24).

### Etapa 3 · Movimientos
- Detalle de cada fila en el panel lateral (pendiente, pactado, en proceso, cobro, pago realizado).
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
1. Transferencia por la misma ventana de pago: origen en la divisa del pago → sin tipo de cambio, sin "Pedir precio", sin fecha valor, token al confirmar (Shenzhen desde Cuenta USD; Mayorista Caribe desde Cuenta USD).
2. Paso Destino "¿A quién le pagas?" para el "Pagar" del encabezado y para "Pagar a otro destinatario" (desde el cobro, con "Volver"); una cuenta propia en otra divisa es compra o venta por la misma ventana de pago, y desde Origen se continúa sin monto.
3. Lado fijo del monto sin factura: "Pagas" y "Recibe" editables, el que se escribe queda fijo y el otro se recalcula en vivo.
4. EUR/USD a 1.175000 / 1.171000 en los dos arquetipos: Shenzhen desde EUR ≈ 1,280.96 EUR; Hotel desde USD ≈ 4,935.00 USD (faltarían 1,435.00 USD el jue 8). Tests, escenarios y muestras de `/sistema` recalculados desde `fx.ts`.
5. Tecla P: nunca se dispara con el foco en un campo (y desde la etapa 8, solo con `?demo=1`).
6. "Concepto" opcional en lugar de "Motivo de pago" (ventana de pago y Cargar un pago; el clásico conserva "Motivo de pago"); "Comprobante" de Lo nuevo abre el detalle del cobro y las descargas de comprobante generan un .html real. Los estados de token incorrecto, origen sin saldo y pactada sin saldo quedaron como estaban.

### Etapa 7 · Pendientes del prototipo
- Alta de destinatario ("Agregar destinatario" en el paso Destino, en Destinatarios y en el clásico): nombre, divisa, banco y cuenta o CLABE; desde el paso Destino, "Guardar y pagar" sigue con el pago.
- Secciones del menú como vistas reales: Control de operaciones (pactadas, en proceso y realizadas, con detalle), Destinatarios (cuenta, pendientes, "Pagar" sin monto) y Monitoreo de divisas (pares con sus dos lados, el ejecutable y la tendencia). "Operaciones recientes" del clásico lleva a Control. (Desde C-52 quedan en el código sin entrada.)
- Campana con notificaciones derivadas del estado; "Ver todas mis cuentas" abre el panel lateral de cuentas con CLABE, "Pasar dinero" y "Ver datos para depositar".
- Transferencia con saldo insuficiente: la cuenta queda deshabilitada ("No alcanza el saldo") y la revisión bloquea si el monto escrito supera el saldo.
- `?seccion=control|destinatarios|monitoreo`; frames N1–N6 en `/tablero/alta` (desde C-52 esas secciones caen en Inicio y quedan N4–N6).

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

### Etapa 9 · Tabla de pares, recorrido y ventana de pago (C-45 a C-47)
1. Una sola tabla de pares que cierra en las seis vueltas MXN/USD/EUR (C-45).
2. El recorrido aparece junto a su objetivo también en `/tablero/alta` (C-46).
3. Operar en una ventana centrada de dos columnas y consultar en el panel lateral (C-47).

### Etapa 10 · Después del check-in con Mateo (C-48 a C-52)
Criterio: sus usuarios son tesoreros poco sofisticados que se marean rápido; en cada paso, solo lo que cambia la decisión.
1. Precio en vivo: "Pedir precio" abre 2 minutos para confirmar y el ejecutable se mueve con el mercado; queda fijo el lado del monto que eligió el usuario y la operación se cierra con el precio del momento de confirmar (C-48).
2. Menos contenido: Origen sin monto solo con nombre y saldo, un chip como mucho, Destino sin "Pagos próximos" (el pago cargado del destinatario se ofrece en la revisión con "Usar este pago"), "Cobraste hoy" en el inicio (C-49).
3. Qué sale y qué llega: comisión por clase ("Comisión 0%" en todas partes), transferencia con un solo monto y confirmación con los montos finales y las mismas filas que el comprobante y el detalle (C-50).
4. Fecha de liquidación: el texto dice el beneficio de elegir otro día; aviso de fondeo sin "para que el pago salga" (C-51).
5. Menú: solo Inicio navega; la lista completa de movimientos es una vista de Inicio (C-52).

## 3. Estado actual por área

### Flujos que funcionan de punta a punta
- Pago de un pago cargado con tipo de cambio (compra), hoy o con fecha valor (pactada), con el precio ejecutable en vivo y 2 minutos para confirmar, vencimiento y token (000000 simula error).
- Pago desde la cuenta de la misma divisa (transferencia sin TDC, un solo monto: "Envías").
- Compra o venta a cuenta propia desde "Comprar X", desde el "Pagar" del encabezado o desde "Pagar a otro destinatario", con montos "Recibe" / "Pagas" editables.
- Entrada desde el cobro ("Usar para pagar"): paso "¿Qué pagas con este cobro?" en los dos arquetipos.
- Detalle de movimientos, cargar pagos, comprobantes descargables, lista completa de movimientos ("Ver todos los movimientos"), alta de destinatario, notificaciones y panel de cuentas; el menú solo navega a Inicio (C-52).
- Operar clásico (Comprar, Vender, Transferir) con el mismo motor, aviso de par sin prototipo, mercado cerrado por escenario.
- Onboarding, modo demo (con la tecla P), escenarios por URL, TDC en vivo.

### Motor y datos
- `src/lib/dinero.ts`, `fx.ts`, `posicion.ts`, `format.ts`: todo el cálculo; ningún monto escrito a mano en componentes.
- `src/data/escenario.ts` (importadora), `escenario-turismo.ts`, `arquetipos.ts`: datos ficticios marcados.
- `src/state/estado.ts` (reducer puro), `derivados.ts`, `vistas.ts` (selectores), `escenarios.ts` (escenarios y frames).

### Calidad
- 146 tests de Vitest (motor, posición, comisión y el flujo frame por frame con los números del brief), `npm run lint`, `tsc --noEmit` y `next build` limpios.
- Recorridos con Playwright del flujo principal, movimientos, arquetipos, turismo, sección 7, la ventana de pago (C-47) y el precio en vivo, la comisión, las fechas y el menú (C-48 a C-52, a 1024 × 700 y 1280 × 800) con cero errores de consola; capturas en `docs/design/verificacion/` y de los prototipos en `docs/design/frames/`.
- Accesibilidad: diálogo con foco atrapado y Esc, radiogroups con flechas (saltan deshabilitadas), cuenta regresiva con aria-live, estados siempre en badge con texto, foco visible, es-MX con tuteo.

### Documentación
- `README.md` (cómo correr, rutas, parámetros, estructura, decisiones), `docs/decisiones.md` (C-01 a C-52), `docs/diferencias-cc-vs-diseno.md` (turismo y sección 7), `docs/handoff/` y `docs/handoff-turismo/` (paquetes de diseño tal como llegaron).

## 4. Pendiente y límites conocidos

- "Subir documento" (no hay OCR ni factura real) y "Horarios de operación" (el horario es un dato sin confirmar): toast.
- El alta de destinatario no valida contra el banco y vive en memoria, como todo el estado.
- Errores de red o de precio, reintentos de token, horario real de mercado, pago parcial o múltiple, pagos MXN dentro de la semana en la gráfica, persistencia entre recargas, móvil: fuera del alcance actual.
- Diferencias con el archivo de diseño del flujo secundario (precio ejecutable por factor, banda del TDC, tarjeta de tipo de cambio compacta, copys de la ventana de pago, orden de OpcionPago): registradas en `docs/diferencias-cc-vs-diseno.md`, el código manda.
- Vercel: producción sigue atada a la rama `claude/determined-thompson-n0zgns`; al mergear a `main` conviene cambiar la rama de producción. Las URLs `.vercel.app` tienen protección SSO.
