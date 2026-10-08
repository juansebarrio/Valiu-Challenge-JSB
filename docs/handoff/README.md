# Handoff · Valiu · Flujo principal de pago (challenge 1)

## Qué es

Rediseño del home de Valiu (plataforma B2B de pagos internacionales y cambio de divisas en México) y del flujo "pagar una factura en dólares con pesos". Una importadora entra, el home le muestra que le faltan 1,000 USD para los pagos de la semana, paga la factura de Shenzhen Parts Co. (1,500.00 USD, vence el jue 8) desde su cuenta en pesos en un panel lateral, y vuelve al home con la posición resuelta. Incluye la rama de **fecha valor** (cerrar el precio hoy y que el dinero salga otro día), la pestaña **Operar clásico** (el formulario actual) y un **onboarding** de 4 pasos.

## Sobre los archivos de diseño

Los archivos de `prototipo/` son **referencias de diseño hechas en HTML**: muestran la apariencia y el comportamiento esperados; no son código de producción para copiar. La tarea es **recrear estas pantallas en el proyecto Next.js** (App Router, TypeScript, Tailwind) siguiendo sus patrones: todos los valores visuales como variables CSS en `src/styles/tokens.css` (copia de `design-system/colors_and_type.css` + alias `--app-*`), Tailwind mapeado a esas variables, ningún hex ni tamaño suelto en los componentes, sin librerías de componentes de terceros.

Abrir `prototipo/Flujo principal.dc.html` en un navegador (servido por HTTP, no `file://`): arriba a la derecha, **Tablero** muestra los 24 frames en filas; **Prototipo** arranca en el onboarding y los botones navegan (← → cambian de frame, P pausa la cuenta regresiva). Cada componente del HTML lleva `data-component="Nombre"` con el nombre que debe tener en el código.

## Fidelidad

**Alta fidelidad.** Colores, tipografía, espaciados, estados y copy son finales; recrear tal cual con los tokens del design system. Los únicos datos inventados están marcados en `src/data/escenario-importadora.ts`.

## Mapa de pantallas (frames de 1280 px, alto según contenido)

Flujo principal (fila 1): 01 Home con faltante → 02 Panel · Origen → 03 Panel · Revisión → 04 Precio y token (cuenta regresiva 1:59) → 05 Precio vencido → 06 Confirmación "Pago enviado" → 07 Home con la posición resuelta.
Fecha valor (fila 2, variantes bajo su frame base): 03B Revisión con jue 8 → 04B Precio y token con "El dinero sale el jue 8" → 06B "Pago pactado" → 07B Home con el pago pactado. Más la hoja de estados de FechaLiquidacion, TarjetaPosicion y OpcionOrigen.
Operar clásico (fila 3): 08 vacío → 09 selector de par → 10 compra completa → 11 precio fijo y token → 12 vencido → 13 venta con error de saldo → 14 transferir con selector de destino → 15 transferencia lista → 16 mercado cerrado.
Onboarding (fila 4): 17–20, primera pantalla del prototipo.

La tabla frame por frame, con qué cambia y los hotspots, está en `docs/componentes.md` (secciones "Frames" y "Fecha valor").

## Rutas sugeridas

- `/` (home): AppShell + pestañas **Posición consolidada** / **Operar clásico**. El panel de pago se abre sobre el home (query `?pago=<id>` o estado de UI; no es una página).
- `/sistema`: guía viva con tokens y componentes en sus estados (puede nacer de `design-system/ui_kit.html` y la hoja de estados del prototipo).
- `/tablero`: opcional, los frames escalados con título y nota (como el modo Tablero del prototipo).

## Layout del AppShell (todos los frames)

- Sidebar 240 px, blanco, `border-right: 0.5px solid #E2E4E9`, padding 16 8; logo 22 px de alto; ítems 40 px de alto, radio 8, padding 0 10, gap 10, ícono 18 px; activo bg #F6FBFF, texto e ícono #0086FF 14/600; inactivo 14/500 #151522; hover bg #F6FBFF. Ítems: Inicio (activo), Movimientos, Control de operaciones, Destinatarios, Monitoreo de divisas; abajo "Cerrar sesión" en #5B5B64. Colapsable a 64 px (ítem 48×40 solo ícono).
- Header 48 px, blanco, `border-bottom: 0.5px solid #E2E4E9`, padding 0 32, contenido a la derecha: botón flotante "Contáctanos" (borde 1 px #3D46CC, radio 40, padding 6 12, 12/600 #3D46CC, ícono whatsapp 16, Shadow High) y campana 22 px.
- Main padding 24 32 32, fondo #F5F7FA, gap 20 entre bloques. Encabezado: h1 "Inicio" 700 24/28 + "Servicios Corporativos KAAX · martes 6 de octubre" 400 14/20 #5B5B64; a la derecha "Subir documento" y "Pagar", los dos Secondary Large.
- Pestañas (DS): padding 14 16, 16/20; activa 600 #151522 sobre #F6FBFF con subrayado 2 px #0086FF; inactiva 400 #5B5B64; fila con `border-bottom: 1px solid #E2E4E9`.
- Grilla del home: tres columnas iguales con gap 24 (`repeat(3, minmax(0,1fr))`). Posición por divisa ocupa las tres; debajo, la columna izquierda (`span 2`) lleva Lo nuevo y Movimientos y la derecha Tipo de cambio y Cuentas, de modo que la tarjeta EUR, el tipo de cambio y las cuentas quedan alineados.
- Footer 40 px, 12/16 #5B5B64, centrado: "Las operaciones bancarias serán realizadas por Banco BASE · Términos y condiciones · Aviso de privacidad".

## Componentes

Especificación completa (props, medidas, colores, estados, copy) en `docs/componentes.md`. Nombres de código: AppShell, TarjetaPosicion, FranjaNuevo, FilaMovimiento, TarjetaTipoDeCambio, ModuloCuentas, PanelOperar, OpcionOrigen, BloqueMonto, FechaLiquidacion, PrecioEjecutable, CampoToken, AvisoResultado, PasoOnboarding, FormularioOperar (SelectorPar, SelectorDestino, CampoMontoDoble, Cotizacion, CajaTdcValiu), AvisoVistaAnterior.

Reglas transversales:
- Un solo botón primario por vista (Primary: bg #3D46CC, hover #0086FF, radio 4, 14/700 Large = 36 px, 16/700 ExtraLarge = 40 px; Secondary: borde 1 px #3D46CC, texto #3D46CC, hover bg #F6FBFF; deshabilitado bg #F5F7FA texto #DCDCDE).
- Montos a la derecha, `font-variant-numeric: tabular-nums`, peso 600; formato `1,180,000.00 MXN`; tipo de cambio con seis decimales; positivos en #177B4B, negativos en el color de texto (desvío documentado, D-19); #B40909 solo para faltantes.
- Estados siempre en badge (tag del DS: radio 16, padding 4 12 4 8, punto 8 px, texto 12/500 #151522): Success #EBFFF6/#82DAB5 (Alcanza, En vivo, Precio fijo), Warning #FCEFCE/#F5CE6C (En proceso, Hoy no alcanza, últimos 30 s), Error #FFF1F1/#D26B6B (Falta, Vencido), Neutral #F5F7FA/#8492A6 (Fijo, Sin tipo de cambio), Pactada #EDF3FF/#0086FF.
- Inputs: min-height 48, padding 12, radio 8, borde 0.5 px #021734; activo 1 px #0086FF; error 1 px #B40909 con mensaje 12/500 #B40909 debajo; label 12/700 #1C293B.
- Foco visible en todo control: `outline: 2px solid #0086FF; outline-offset: 2px`.
- Copy en español de México, tuteo, verbos desde el usuario (Pagas, Compras, Recibe).

## Interacciones y estado

- **Abrir el panel**: "Pagar" en una FilaMovimiento (o la fila entera) abre PanelOperar con destinatario, monto, vencimiento y referencia precargados; "Comprar 1,000 USD" de la TarjetaPosicion abre el mismo panel con destino = cuenta USD propia y monto = faltante; "Pagar" del encabezado abre el panel vacío con el paso "¿A quién le pagas?" (no diseñado todavía).
- **Deducción**: con origen y destino se deduce tipo (transferencia / compra / venta), par y punta con `src/lib/fx.ts`; la UI nunca pide el tipo.
- **Panel**: pasos origen → revisión → precio y token → confirmación. Esc cierra; Tab recorre opciones y botones; el footer lleva secundario + primario. Overlay rgba(21,21,34,.4); panel 480 px, radio 16 a la izquierda, `--shadow-lg`.
- **Precio**: indicativo en vivo hasta "Pedir precio" (el TDC se mueve en una banda chica, pendiente de implementar en el prototipo); al pedirlo, precio ejecutable fijo por 120 s con cuenta regresiva m:ss (badge Success; Warning en los últimos 30 s); a 0 → estado vencido (alert error, montos al indicativo, token deshabilitado, CTA "Pedir precio"). Cambiar el monto con precio fijo lo invalida. Atajo P pausa la cuenta regresiva en demos.
- **Token**: seis casillas numéricas; autoavance; "Confirmar pago" se habilita con 6 dígitos.
- **Fecha valor**: FechaLiquidacion solo con tipo de cambio; opciones Hoy + 3 días hábiles con fechas reales (`fechasLiquidacion()` en `fx.ts`); "vence" en el día de vencimiento; por defecto Hoy; se elige antes de pedir precio. Si no es Hoy: consecuencia "Cierras hoy el precio…", resumen "El dinero sale el …", confirmación "Pago pactado" con badge Pactada y aviso de fondeo; en el home, MXN suma "Pactadas por liquidar (1)", el pago sigue en Próximos con badge Pactada y detalle "27,138.62 MXN a 18.092415".
- **Vuelta al home**: 07 muestra AvisoResultado success "Pago enviado. Ya te alcanza para los pagos en USD de la semana.", USD "Alcanza", Shenzhen en Realizados con "En proceso" y "1,500.00 USD a 18.092415", MXN 1,152,861.38.
- **Onboarding**: 4 pasos sobre el home real (posición → movimientos → tipo de cambio → pestaña Operar clásico); mide el elemento objetivo con getBoundingClientRect, recorte con `box-shadow: 0 0 0 2000px rgba(21,21,34,.55)` y outline 2 px #0086FF; tarjeta 320 px al lado; Atrás / Siguiente / cerrar; "Empezar" al final. Se muestra una vez (flag en el perfil) y queda accesible desde Ayuda.
- **Operar clásico**: AvisoVistaAnterior con link "Probar el nuevo flujo" (abre el panel); formulario con tabs Comprar / Vender / Transferir, selector de par agrupado, split Compras / Pagas, Origen / Destino con buscador, Motivo / Referencia, cotización con CajaTdcValiu, un CTA que pasa de "Pedir precio" a "Confirmar"; error inline de saldo; transferencias sin TDC; mercado cerrado con alert y "Programar · Futuro".

Estado mínimo (cliente): pestaña activa, panel {abierto, paso, pagoId, origenId, ladoFijo, monto, fechaValor, precio {estado: indicativo|fijo|vencido, tdc, vence_en}, token}, onboarding {visto, paso}, cuenta regresiva (pausable). Datos: cuentas, pagos futuros, movimientos, TDC (polling o socket; en el prototipo, banda ±0.003).

## Design system

Oficial, en `design-system/`: `colors_and_type.css` (tokens), `tokens-figma.md` (valores verificados en Figma: paleta, feedback, geometría, íconos Unicons), `components-atomic.md` y `components-complex.md` (snippets canónicos), `ui_kit.html`, logos SVG (`fill="currentColor"`). Resumen de uso y precedencias en `docs/design-system-uso.md`. Tipografía Montserrat 400/500/600/700 (`next/font`). Íconos Unicons Line (`@iconscout/react-unicons`; en el prototipo, CDN): estate, credit-card, chart, sign-alt, chart-line, whatsapp, bell, signout, times, lock, info-circle, check-circle, calendar-alt, clock-ten, search, plus, arrow-right, arrow-down, angle-down-b, angle-up-b. No usar el mint (#E8F7F9) todavía.

Tokens usados, en `docs/componentes.md` → "Tokens usados".

## Decisiones

`docs/decisiones.md`: D-16 a D-29 aplican a este flujo (DS oficial, Unicons, accesibilidad por encima del DS, color de signo, badges, confirmación en el panel, pestañas, Operar clásico, onboarding, fecha valor, segmented con indigo, badge Pactada sin mint). D-01 a D-15 son del relevamiento previo y quedaron superadas o absorbidas.

## Código incluido

- `src/lib/fx.ts` + `fx.test.ts` (vitest): deducción de tipo, par y punta; cotización con lado fijo; fechas de liquidación.
- `src/lib/format.ts`: montos, tipo de cambio, fechas, cuenta regresiva.
- `src/data/escenario-importadora.ts`: todos los números del flujo.

## Pendiente / fuera de este paquete

- Tipo de cambio "en vivo" moviéndose en una banda chica y congelado al fijar precio (el prototipo lo muestra estático).
- Paso "¿A quién le pagas?" para el "Pagar" del encabezado.
- Export del ícono custom de IA desde Figma (node 4345:745); en el DS no está.
- Capturas de los frames: no van incluidas; se pueden generar desde el prototipo si hacen falta.
