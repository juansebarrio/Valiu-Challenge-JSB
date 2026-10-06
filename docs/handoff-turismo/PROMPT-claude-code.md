# Prompt para Claude Code · Flujo secundario (turismo) + pantalla inicial de arquetipos

Copiar desde la línea siguiente hasta el final.

---

Estás en el proyecto Next.js (App Router, TypeScript, Tailwind) que implementa el home rediseñado de Valiu: AppShell, pestañas Posición consolidada / Operar clásico, PanelOperar con pasos origen → revisión → precio y token → confirmación, fecha valor y onboarding, con el escenario de la importadora. Ese código ya recibió cambios de diseño hechos directamente acá, que no están en los archivos de diseño.

Acabo de agregar la carpeta `design_handoff_valiu_flujo_secundario/`. Leé en este orden: `README.md`, `docs/componentes.md`, `src/data/escenario-turismo.ts`, y recorré `prototipo/Flujo secundario.dc.html` servido por HTTP (modo Tablero para ver los 8 frames; Prototipo para navegarlos; el tweak `historia` alterna la variante vie 9 / Hoy).

## Regla de precedencia (no negociable)

1. **El código manda.** Donde el diseño y el codebase difieran en algo que ya existe (componentes, tokens, medidas, copy, comportamiento), conservá el código. No "alinees" el código al diseño.
2. **Del diseño tomá solo lo nuevo**, y construilo extendiendo los componentes existentes (props y estados nuevos), nunca duplicándolos ni creando variantes paralelas.
3. **Registrá cada diferencia** entre código y diseño en `docs/diferencias-cc-vs-diseno.md` con una fila por diferencia: componente · propiedad · valor en código · valor en diseño · frame donde se ve (S01–S08). Es la lista para sincronizar el archivo de diseño después; no toques el código por eso.
4. Si algo nuevo choca con una decisión que ya está en el código, adaptá lo nuevo a esa decisión y anotalo en el mismo archivo.

## Qué construir

### 1. Escenario turismo
- Crear `src/data/escenario-turismo.ts` a partir del archivo del handoff, con la misma forma que el escenario de la importadora que ya existe en el proyecto (respetá los tipos actuales; si falta algún campo en el tipo, extendelo de forma opcional). Conservá los comentarios "inventado".
- Agregar a `fx.test.ts` los casos: compra EUR con MXN (4,200 × 21.25 = 89,250.00), EUR desde USD con el cross 1.085 (4,557.00 USD) y `fechasLiquidacion()` con vencimiento vie 9 (la opción "vie 9" lleva "vence").

### 2. Pantalla inicial · elegir arquetipo (ruta `/`)
Tipo login de demo, sin contraseña. Especificación completa en el README (sección "Pantalla inicial"). En resumen: fondo de app, logo Valiu centrado, título "¿Con quién entras?", subtítulo "Dos empresas de ejemplo, dos semanas de pagos.", dos tarjetas de 360 px (avatar con iniciales JR / ML, empresa, persona y rol, tres líneas de contexto, CTA Primary Large "Entrar como Jorge R." / "Entrar como Mariana L."), footer de la app. Usá los tokens y componentes existentes (tarjeta blanca radio 8 con Shadow Mid, botón Primary, tipografía Montserrat). Apiladas bajo 800 px. Tab recorre las tarjetas, Enter entra.
- Al entrar: guardar `empresa` (`'importadora' | 'turismo'`) en cookie o localStorage y navegar a `/importadora` o `/turismo`. Mover el home actual a `/importadora` sin cambiarle nada más que la fuente de datos. Onboarding de 4 pasos la primera vez **por arquetipo**. "Cerrar sesión" del sidebar vuelve a `/`.

### 3. Flujo secundario `/turismo` (frames S01–S08 de `docs/componentes.md`)
Reusar el home y el panel existentes con el escenario turismo. Lo nuevo:
- **PanelOperar · paso `pago`** ("¿Qué pagas con este cobro?"), abierto desde "Usar para pagar" de FranjaNuevo (`?cobro=<id>`): lista de **OpcionPago** (misma anatomía que la OpcionOrigen actual del código): nombre del destinatario y monto del pago a la derecha; línea "Vence vie 9 · Reserva 88213 · usa ≈ 89,250.00 MXN"; badge de consecuencia (Success "Cubre el faltante en EUR" / Neutral "Ya lo cubre tu Cuenta USD"); el único faltante viene seleccionado; una sola selección. Debajo: "Del cobro quedan ≈ 5,750.00 MXN en tu Cuenta Principal MXN." y link "Pagar a otro destinatario" (sin destino todavía: dejarlo deshabilitado con tooltip o `aria-disabled`). Título del panel "Usar el cobro de Familia Ortega", subtítulo "+95,000.00 MXN · Hoy 08:15 · Ref. Paquete Madrid". Continuar → paso origen con la cuenta donde entró el cobro seleccionada y título "Pagar al Hotel Gran Vía Madrid · 4,200.00 EUR · vence vie 9 · Reserva 88213".
- **OpcionOrigen · estado `deshabilitada`** cuando la cuenta no tiene saldo en la divisa del pago (Cuenta EUR con 0.00): no seleccionable, fuera del tab order, `cursor: not-allowed`, badge Neutral "Sin saldo"; colores de deshabilitado los que ya use el código para ese estado (si no existe, fondo de app + texto secundario). La Cuenta USD queda elegible con badge Warning "Te faltarían 1,057.00 USD el jueves".
- **TarjetaTipoDeCambio · `pares[]`**: el primero con tendencia (EUR/MXN), los siguientes compactos (USD/MXN, solo puntas) separados por el divisor del DS. Rótulos "Para comprar EUR" / "Para vender EUR". Si en el código la tarjeta ya cambió de forma, respetá esa forma y agregá solo la lista.
- **TarjetaPosicion · casos nuevos**: saldo 0.00 con faltante igual al pago (proyección plana en cero que cae el día del pago, marcador rojo, "vie 9" destacado); divisa sin pendientes ("Nada pendiente en pesos", sin cifra ni badge, con línea secundaria); orden de tarjetas: la divisa con faltante primero y el orden no cambia durante la sesión (D-34).
- **TDC indicativo en vivo**: un hook que entregue el último precio indicativo (en demo: banda ±0.0012 alrededor de 21.250000, un paso al azar cada 2 s); todos los montos "≈" (Pagas, usa, quedan, queda en, línea de la tarjeta EUR) se derivan de ese valor; se congela al pedir precio y después de confirmar; la tecla P lo pausa junto con la cuenta regresiva.
- **Fecha valor** como ya está en el código (Hoy por defecto, "vence" en vie 9). Con vie 9: revisión con "Cierras hoy el precio…", resumen "El dinero sale el vie 9", confirmación "Pago pactado" con el aviso de saldo, home con badge Pactada en el Hotel (detalle "89,256.09 MXN a 21.251450") y "Pactadas por liquidar (1) −89,256.09" en MXN. Con Hoy: "Pago enviado", Hotel en Realizados con "En proceso", MXN 330,743.91. La fecha elegida se conserva al vencer el precio.
- Hotspots: "Usar para pagar" → paso pago; "Pagar" en la fila del Hotel → paso origen; "Comprar 4,200 EUR" y "Pagar" de Mayorista Caribe quedan sin acción (pendientes), deshabilitados con `aria-disabled`.

## Restricciones
- Todo valor visual desde `src/styles/tokens.css` (sin hex ni tamaños sueltos en componentes), Tailwind mapeado a esas variables, sin librerías de componentes de terceros. Montserrat, Unicons.
- Un botón primario por vista; estados siempre en badge; montos tabulares `1,000.00 MXN`; TDC con seis decimales; faltantes en `--danger`; foco visible en todo control; copy en español de México, tuteo.
- No rompas el flujo de la importadora: sus pantallas deben verse igual que antes de este trabajo.

## Entregables
1. Código con las rutas `/`, `/importadora`, `/turismo` funcionando, y `/sistema` actualizado con OpcionPago, OpcionOrigen deshabilitada y TarjetaTipoDeCambio con dos pares.
2. `docs/diferencias-cc-vs-diseno.md` con todas las diferencias encontradas (aunque sea una tabla corta).
3. Tests de `fx.test.ts` en verde.
4. Al final, un resumen breve: qué reusaste, qué extendiste, qué quedó pendiente, y las 3–5 diferencias más grandes entre código y diseño para que yo sincronice el archivo de diseño.

Trabajá en una rama `feat/flujo-turismo`, con commits por bloque (escenario y tests · pantalla inicial y rutas · paso pago y OpcionPago · estados nuevos de componentes · TDC en vivo · docs). Si algo del handoff es ambiguo, elegí la opción que menos toque el código existente y anotalo en el archivo de diferencias.
