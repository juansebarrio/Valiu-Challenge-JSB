# Handoff · Valiu · Flujo secundario (challenge 2 · turismo) + pantalla inicial de arquetipos

## Qué es

Segunda escena del rediseño del home de Valiu. **Viajes Altavista**, una minorista de turismo, cobra en pesos a sus clientes y paga en euros a los hoteles. Hoy martes 6 de octubre, 08:15, entra el cobro de Familia Ortega (95,000.00 MXN, Paquete Madrid). El pago al Hotel Gran Vía Madrid (4,200.00 EUR, Reserva 88213) vence el vie 9 y la Cuenta EUR está en 0.00. Mariana usa el cobro para pagar el hotel, cierra hoy el precio de los euros y elige que el dinero salga el vie 9: la operación queda **Pactada**.

Incluye además una **pantalla inicial** (tipo login de demo) para elegir con qué empresa se entra: la importadora del flujo principal o la minorista de turismo de este flujo.

## Precedencia: el código manda

El proyecto Next.js ya implementa el flujo principal y **recibió cambios de diseño hechos directamente en Claude Code** que no están en los archivos de diseño. Regla para este handoff:

1. **Lo que ya existe en el código gana.** Si un componente, token, medida, copy o comportamiento del codebase difiere de lo que muestra `prototipo/Flujo secundario.dc.html` o `docs/componentes.md`, se conserva la versión del código. No "corregir" el código para que coincida con el diseño.
2. **El diseño aporta solo lo nuevo.** De este paquete se toman: el escenario turismo, el paso "¿Qué pagas con este cobro?" (OpcionPago), el estado deshabilitado de OpcionOrigen, `pares[]` en TarjetaTipoDeCambio, el TDC indicativo en vivo, los casos nuevos de TarjetaPosicion y la pantalla inicial de arquetipos. Todo lo nuevo se construye **con los componentes y tokens tal como están hoy en el código**, extendiéndolos (props y estados nuevos), no duplicándolos.
3. **Registrar las diferencias, no resolverlas.** Cada diferencia encontrada entre código y diseño se anota en `docs/diferencias-cc-vs-diseno.md` (componente · propiedad · valor en código · valor en diseño · frame donde se ve). Ese archivo es la lista con la que después se sincroniza el archivo de diseño; no se toca el código por eso.
4. **Si algo nuevo choca con una decisión del código** (por ejemplo, el código ya cambió la anatomía de OpcionOrigen), se adapta lo nuevo a esa anatomía y se anota en el mismo archivo.

## Sobre los archivos de diseño

Los archivos de `prototipo/` son **referencias de diseño hechas en HTML**: muestran la intención; no son código de producción para copiar. Abrir `prototipo/Flujo secundario.dc.html` servido por HTTP: **Tablero** muestra los 8 frames en fila; **Prototipo** navega con los botones (← → cambian de frame, P pausa la cuenta regresiva y el TDC en vivo). El tweak `historia` (`pactado` | `hoy`) renderiza el tablero en la variante con fecha valor vie 9 (la historia) o con Hoy (pago enviado). Cada componente lleva `data-component="Nombre"`.

## Fidelidad

**Alta fidelidad para lo nuevo** (OpcionPago, estado deshabilitado, tarjeta de tipo de cambio con dos pares, pantalla inicial), con la salvedad de la precedencia: medidas, colores y tipografía se toman de los componentes existentes en el código cuando ya existen. Los datos inventados están marcados en `src/data/escenario-turismo.ts`.

## Mapa de pantallas

Flujo secundario (frames de 1280 px): S01 Home · Turismo → S02 Panel · ¿Qué pagas con este cobro? → S03 Panel · Origen → S04 Panel · Revisión (fecha valor, vie 9) → S05 Precio y token (1:59) → S06 Precio vencido → S07 Confirmación · Pago pactado → S08 Home con el pago pactado. Con Hoy en S04, S07 y S08 son las variantes "Pago enviado" del flujo principal (06 y 07).

Tabla frame por frame, hotspots y especificación de componentes: `docs/componentes.md`. Decisiones D-30 a D-34: `docs/decisiones.md`.

## Pantalla inicial · Elegir arquetipo (nueva, sin frame de diseño; se construye directo en código con el AppShell y los tokens existentes)

- **Ruta** `/`. Fondo #F5F7FA (fondo de app). Sin sidebar ni header de la app. Logo Valiu (`logo-valiu-dark.svg`, 28 px de alto) centrado arriba, 48 px bajo el borde superior.
- **Título** "¿Con quién entras?" (Headline 24/28 700, centrado) y subtítulo "Dos empresas de ejemplo, dos semanas de pagos." (14/20 400 Grey1), 8 px entre ambos; 32 px hasta las tarjetas.
- **Dos tarjetas** lado a lado (grid de 2 columnas de 360 px, gap 24; apiladas bajo 800 px), blancas, radio 8, Shadow Mid, padding 24, mismo alto. Cada una, de arriba abajo con gap 12:
  - Avatar con iniciales (40 px, círculo, fondo #F6FBFF, texto 14/600 #3D46CC): "JR" y "ML".
  - Empresa 16/24 600: "Importadora del Bajío S.A. de C.V." · "Viajes Altavista S.A. de C.V.".
  - Persona y rol 14/20 400 Grey1: "Jorge R. · Tesorería" · "Mariana L. · Administración".
  - Tres líneas de contexto 14/20 400, con punto de 6 px #8492A6 delante (lista sin viñeta nativa):
    - Importadora: "Faltan 1,000.00 USD para los pagos de la semana" · "Paga 1,500.00 USD a Shenzhen Parts Co. con pesos" · "Acaba de cobrar 180,000.00 MXN de Comercial Norte".
    - Turismo: "La Cuenta EUR está en cero: faltan 4,200.00 EUR" · "Cobra 95,000.00 MXN de Familia Ortega y paga al Hotel Gran Vía Madrid el viernes" · "Cierra hoy el precio; el dinero sale el vie 9".
  - CTA Primary Large a todo el ancho, con margin-top auto: "Entrar como Jorge R." · "Entrar como Mariana L.". Un primario por tarjeta es aceptable acá porque cada tarjeta es una opción equivalente.
- **Footer** de la app (misma línea "Las operaciones bancarias serán realizadas por Banco BASE · …").
- **Comportamiento:** el CTA guarda el arquetipo elegido (`empresa: 'importadora' | 'turismo'`, cookie o localStorage) y navega al home de esa empresa. El onboarding de 4 pasos se muestra la primera vez por arquetipo. "Cerrar sesión" en el sidebar vuelve a `/`. Tab recorre las dos tarjetas (el CTA es el foco); Enter entra.
- **Rutas sugeridas:** `/` selector · `/importadora` y `/turismo` (home con pestañas Posición consolidada / Operar clásico; el panel de pago se abre sobre el home con `?pago=<id>` o `?cobro=<id>` para el paso "¿Qué pagas con este cobro?") · `/sistema` como estaba.

## Datos del escenario (del pedido; lo inventado está marcado en el archivo)

Cuentas 420,000.00 MXN (****4410) / 6,000.00 USD (****8821) / 0.00 EUR (****9034). Pagos: Mayorista Caribe 2,500.00 USD jue 8 · Hotel Gran Vía Madrid 4,200.00 EUR vie 9. Cobro: Familia Ortega 95,000.00 MXN hoy 08:15, BBVA México, Ref. Paquete Madrid. Tipo de cambio: EUR/MXN compra 21.250000 (venta 21.100000, inventada), ejecutable 21.251450 (inventado) → 89,256.09 MXN; EUR/USD 1.085 → 4,557.00 USD desde la Cuenta USD (faltarían 1,057.00 USD el jueves); USD/MXN 18.091183 / 18.032135. Resultado: MXN 330,743.91 si paga hoy; con fecha valor, Saldo 420,000.00 y "Pactadas por liquidar (1) −89,256.09 · Sobran 330,743.91".

## Interacciones nuevas (resumen; detalle en `docs/componentes.md`)

- **Usar para pagar** (FranjaNuevo) abre PanelOperar en el paso `pago` con el cobro como contexto: lista de pagos pendientes (OpcionPago) con monto, vencimiento, referencia, cuánto del cobro usa y consecuencia en badge; el único faltante viene seleccionado; "Del cobro quedan ≈ 5,750.00 MXN…"; link "Pagar a otro destinatario" (sin diseñar). Continuar → origen con la cuenta donde entró el cobro seleccionada.
- **OpcionOrigen deshabilitada** cuando la cuenta no tiene saldo en la divisa del pago (badge Neutral "Sin saldo", no focusable, `cursor: not-allowed`).
- **TDC indicativo en vivo**: polling/socket; en demo, banda ±0.0012 alrededor de 21.250000, paso cada 2 s; todos los montos "≈" se derivan del último precio; se congela al pedir precio y después de confirmar.
- **Fecha valor**: Hoy por defecto; "vence" en vie 9; con otra fecha, confirmación "Pago pactado", badge Pactada en Próximos con detalle "89,256.09 MXN a 21.251450" y "Pactadas por liquidar" en la tarjeta MXN. La fecha se conserva al vencer el precio.
- **Entrada alternativa**: "Pagar" en la fila del Hotel abre el panel directo en origen (S03).

## Estado mínimo (cliente)

Igual al flujo principal más: `empresa` (arquetipo), `panel.cobroId` (cuando se entra desde el cobro), `panel.pagoId` elegido en el paso `pago`, `tdcIndicativo` (último valor recibido) y `onboardingVisto` por arquetipo.

## Código incluido

- `src/data/escenario-turismo.ts`: todos los números del flujo, con lo inventado marcado.
- `src/data/escenarios-prototipo.js`: los dos escenarios tal como los usa el prototipo (referencia).
- `fx.ts` y `format.ts` del paquete anterior siguen valiendo; agregar a `fx.test.ts` los casos EUR→MXN (compra), EUR desde USD (cross 1.085) y fechas de liquidación con vencimiento vie 9.

## Pendiente / fuera de este paquete

- "Comprar 4,200 EUR" de la tarjeta EUR (compra a cuenta propia, sin destinatario) y "Pagar a otro destinatario" (paso "¿A quién le pagas?").
- "Pagar" en la fila de Mayorista Caribe (panel con origen Cuenta USD, sin tipo de cambio).
- Pestaña Operar clásico con las cuentas de Viajes Altavista: igual a los frames 08–16 del flujo principal.
- Capturas de los frames: no van incluidas; se generan desde el prototipo si hacen falta.

## Archivos

- `PROMPT-claude-code.md`: el prompt para arrancar en Claude Code.
- `README.md` (este archivo) · `docs/componentes.md` · `docs/decisiones.md` (D-01 a D-34).
- `prototipo/Flujo secundario.dc.html` + `support.js` + `design-system/colors_and_type.css` + `referencias/logo/`.
- `design-system/`: DS oficial (tokens, kit, snippets, logos), igual al paquete anterior.
- `src/data/escenario-turismo.ts` · `src/data/escenarios-prototipo.js`.
