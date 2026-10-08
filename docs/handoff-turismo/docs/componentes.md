# Handoff · Flujo secundario (challenge 2 · turismo)

Archivo de diseño: `Flujo secundario.dc.html` (8 frames de 1280 px, modo Tablero y modo Prototipo; el prototipo arranca en S01). Mismo AppShell, mismos componentes y tokens que `docs/handoff-flujo-principal.md`; acá va solo lo que cambia o se suma.

## Escena

Viajes Altavista (minorista de turismo) cobra en pesos a sus clientes y paga en euros a los hoteles. Hoy martes 6, 08:15, entra el cobro de Familia Ortega (95,000.00 MXN, Paquete Madrid). El pago al Hotel Gran Vía Madrid (4,200.00 EUR, Reserva 88213) vence el vie 9 y la Cuenta EUR está en 0.00: el faltante es el pago entero. También vence el jue 8 un pago de 2,500.00 USD a Mayorista Caribe, que la Cuenta USD (6,000.00) ya cubre. Mariana usa el cobro para pagar el hotel, cierra hoy el precio de los euros y elige que el dinero salga el vie 9, el día del vencimiento.

Datos del pedido: cuentas 420,000.00 MXN / 6,000.00 USD / 0.00 EUR; pagos 2,500.00 USD jue 8 y 4,200.00 EUR vie 9; cobro 95,000.00 MXN; EUR/MXN 21.25, EUR/USD 1.085, USD/MXN 18.091183 / 18.032135. Inventados: venta EUR/MXN 21.10, precio ejecutable 21.251450 (→ 89,256.09 MXN), referencias, hora del cobro, Aerolínea Centro y Familia Ríos, tendencia intradía. Todo en `src/data/escenarios.js` → `turismo`.

## Frames

| # | Vista | Qué pasa | Hotspots (prototipo) |
|---|---|---|---|
| S01 | Home · Turismo | EUR primero, con saldo 0.00, "Faltan 4,200.00", proyección que cae el vie 9 y "Comprar 4,200 EUR"; USD "Sobran 3,500.00 · Alcanza"; MXN "Nada pendiente en pesos · Incluye los 95,000.00 de Familia Ortega". Lo nuevo: el cobro con "Usar para pagar". Tipo de cambio con EUR/MXN (tendencia) y USD/MXN | "Usar para pagar" → S02 · "Pagar" en la fila del Hotel → S03 |
| S02 | Panel · ¿Qué pagas con este cobro? | Título "Usar el cobro de Familia Ortega"; OpcionPago por pago pendiente con monto, vencimiento, referencia, cuánto del cobro usa y consecuencia en badge; Hotel seleccionado (Success "Cubre el faltante en EUR"), Mayorista Caribe (Neutral "Ya lo cubre tu Cuenta USD"); "Del cobro quedan ≈ 5,750.00 MXN…"; link "Pagar a otro destinatario" | Continuar → S03 · Cancelar / × / fondo → S01 |
| S03 | Panel · Origen | Título "Pagar al Hotel Gran Vía Madrid · 4,200.00 EUR · vence vie 9 · Reserva 88213". Cuenta Principal MXN seleccionada ("Pagas ≈ 89,250.00 MXN", "incluye el cobro de hoy", Success); Cuenta USD elegible ("Pagas ≈ 4,557.00 USD", Warning "Te faltarían 1,057.00 USD el jueves"); Cuenta EUR deshabilitada (Neutral "Sin saldo") | Continuar → S04 · Cancelar → S01 |
| S04 | Panel · Revisión | BloqueMonto (Pagas ≈ 89,250.00 MXN en vivo / Hotel recibe 4,200.00 EUR fijo); FechaLiquidacion Hoy · mié 7 · jue 8 · vie 9 · vence; con vie 9: "Cierras hoy el precio… El vie 9 salen ≈ 89,250.00 MXN…" + "Hoy tienes el saldo…"; CajaTdcValiu EUR/MXN indicativo; Concepto "Pago a proveedores", Referencia "Reserva 88213"; "Tu cuenta en pesos queda en ≈ 330,750.00 MXN" | Llega con Hoy; las fechas cambian el estado en el mismo frame · Pedir precio → S05 · Volver → S03 |
| S05 | Panel · Precio y token | PrecioEjecutable 21.251450 "MXN por EUR", badge "Precio fijo por 1:59" (cuenta regresiva real; Warning en los últimos 30 s), Pagas 89,256.09 MXN, Hotel recibe 4,200.00 EUR, Desde Cuenta Principal MXN, "El dinero sale el vie 9" (si la fecha no es Hoy); CampoToken | Confirmar pago → S07 · Cancelar → S01 · 0:00 → S06 |
| S06 | Panel · Precio vencido | Alert error; precio indicativo en Grey1 y de nuevo en vivo; badge Vencido; token deshabilitado; la fecha elegida se conserva | Pedir precio → S05 · Cancelar → S01 |
| S07 | Confirmación · Pago pactado | "Pago pactado" + badge Pactada; "Cerraste el precio en 21.251450. El vie 9 salen 89,256.09 MXN… y se envían 4,200.00 EUR al Hotel Gran Vía Madrid"; alert info con el saldo a tener ese día. Con Hoy: "Pago enviado" + detalle (como 06 del flujo principal) | Volver al inicio / × → S08 · Descargar comprobante (sin diseñar) |
| S08 | Home con el pago pactado | AvisoResultado info "Pactaste el pago al Hotel Gran Vía Madrid. El dinero sale el vie 9."; EUR "Nada pendiente en euros · Hotel Gran Vía Madrid: pactado en pesos, sale el vie 9"; MXN con "Pactadas por liquidar (1) −89,256.09" y "Sobran 330,743.91 · Alcanza"; Hotel en Próximos con badge Pactada y detalle "89,256.09 MXN a 21.251450". Con Hoy: aviso success, Hotel en Realizados con "En proceso", MXN 330,743.91 | — |

Tweak `historia` (`pactado` | `hoy`) renderiza el tablero en una u otra variante; en el prototipo la define la fecha elegida en S04.

## Componentes nuevos o con cambios

**OpcionPago** (paso `pago` de PanelOperar) · props: `pago {destinatario, monto, divisa, vence, referencia}`, `usa` (monto en la divisa del cobro), `consecuencia {texto, tono: 'ok'|'neutro'|'warn'}`, `seleccionada`, `onSelect`. Misma anatomía y medidas que OpcionOrigen (radio 20, padding 12 16, radio 8; seleccionada borde #3D46CC + bg #F0F1FD): nombre a la izquierda y monto del pago a la derecha (600 14), línea de 12 px "Vence vie 9 · Reserva 88213 · usa ≈ 89,250.00 MXN", badge de consecuencia. Una sola selección. Debajo de la lista: "Del cobro quedan ≈ 5,750.00 MXN en tu Cuenta Principal MXN." (400 14 Grey1) y link "Pagar a otro destinatario" (700 14 #3D46CC subrayado).

**OpcionOrigen** · estado nuevo `deshabilitada` (sin saldo en la divisa del pago): fondo #F5F7FA, borde #E2E4E9, radio del botón #DCDCDE sobre #F5F7FA, nombre y monto en #5B5B64, badge Neutral "Sin saldo", `cursor: not-allowed`, fuera del orden de tabulación. La opción elegible pero insuficiente para otros pagos lleva badge Warning (ya existía).

**PanelOperar** · `paso` suma `'pago'`; título y subtítulo cambian con el paso: "Usar el cobro de Familia Ortega · +95,000.00 MXN · Hoy 08:15 · Ref. Paquete Madrid" en S02 y "Pagar al Hotel Gran Vía Madrid · 4,200.00 EUR · vence vie 9 · Reserva 88213" desde S03.

**FranjaNuevo** · `onUsar` abre el panel en el paso `pago` con el cobro como contexto.

**TarjetaTipoDeCambio** · prop `pares[] {par, base, compra, venta, tendencia?}` en lugar de un solo par: el primero lleva la tendencia ("Tendencia del día · 09:40"); los siguientes van en bloques compactos separados por 1 px #E2E4E9 con padding-top 12. Rótulos "Para comprar EUR" / "Para vender EUR". Sigue "Solo los pares de tus posiciones".

**TarjetaPosicion** · casos nuevos: saldo 0.00 con faltante igual al pago (proyección plana en cero que cae el día del pago, marcador rojo y "vie 9" en #B40909 600); divisa sin pendientes ("Nada pendiente en pesos", sin cifra ni badge, con `linea`). El día del pago en USD (jue 8) va en 600 en el eje.

**BloqueMonto / PrecioEjecutable** · el lado fijo es el del destinatario en EUR; el precio dice "MXN por EUR"; CajaTdcValiu rotula "TDC Valiu · EUR/MXN".

**TDC en vivo** (D-32) · indicativo = 21.250000 ± banda de 0.0012, paso al azar cada 2 s; recalcula "Pagas ≈", "usa ≈", "quedan ≈", "queda en ≈" y la línea de la tarjeta EUR; se congela al pedir precio (S05) y después de confirmar; P lo pausa. En código: polling o socket al precio indicativo; los montos ≈ se derivan siempre del último precio.

## Reglas que se confirman en este flujo

- Un primario por vista: en S01 solo "Comprar 4,200 EUR" (EUR es la única con faltante).
- Estados en badge (Falta, Alcanza, Pactada, En proceso, Sin saldo); faltante en #B40909 solo en la tarjeta EUR.
- Fecha valor: Hoy por defecto; "vence" en vie 9; si no es Hoy la operación queda Pactada y la posición en pesos suma "Pactadas por liquidar".
- La divisa con faltante va primera y no se mueve al resolverse (D-34).

## Pendiente

- "Comprar 4,200 EUR" (compra a cuenta propia sin destinatario; Caso 4 de los wireframes) y "Pagar a otro destinatario" (paso "¿A quién le pagas?").
- "Pagar" en la fila de Mayorista Caribe (mismo panel con origen Cuenta USD, sin tipo de cambio).
- La pestaña Operar clásico de este escenario: igual a los frames 08–16 del flujo principal con las cuentas de Viajes Altavista.
