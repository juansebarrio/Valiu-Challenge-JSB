# Decisiones de diseño

Formato: hallazgo · decisión · alternativa descartada · costo. Numeración continua; la etapa aparece entre corchetes.

---

### D-01 · Un solo azul de acción [0]
- **Hallazgo:** conviven dos azules con rol de acción: #3F46C5 (botones primarios, subrayado de tab) y #0086FF (nav activo, foco de inputs, botón "Ingresar token", stepper, dropzone). Capturas 01, 03, 13.
- **Decisión:** `--color-primary` #3F46C5 para toda acción, foco y selección. #0086FF se conserva solo como `info-dot` en estados.
- **Alternativa descartada:** mantener #0086FF como "secundario activo". No hay regla que explique cuándo va cada uno; la jerarquía deja de ser predecible.
- **Costo:** el nav activo y el foco se ven más oscuros que hoy. Reversible por token.

### D-02 · Texto muted con contraste AA [0]
- **Hallazgo:** labels, placeholders, footer y filas anuladas usan #8492A6: 3.2:1 sobre blanco. Captura 01, 11.
- **Decisión:** `--color-text-muted` #66728A (4.8:1 sobre blanco, 4.5:1 sobre #F6F7FA). #8492A6 queda para íconos decorativos.
- **Alternativa descartada:** mantener #8492A6 y subir el tamaño. No alcanza para AA en 12–14 px.
- **Costo:** el gris se percibe menos "liviano"; compensa con peso 400 y tamaño.

### D-03 · Familias de estado completas y accesibles [0]
- **Hallazgo:** los puntos de estado no llegan a 3:1 (verde #82DAB6 1.7:1, amarillo #F5CF6C 1.5:1), el texto verde #009F17 da 3.4:1, hay dos rojos (#D26C6B, #D83333) y dos amarillos de fondo (#FFF8E5, #FCF0CE); "Por autorizar" usa un fondo verde-agua (#E8F8F9) sin familia. Capturas 01, 06, 11, 14.
- **Decisión:** seis familias (info, success, warning, danger, pending, neutral) con `dot` ≥ 3:1, `soft` y `text` ≥ 4.5:1. Mapeo por estado en el DS (2.4), pendiente de confirmar con ui-actual.md.
- **Alternativa descartada:** copiar los colores tal cual para ser "fieles". Rompe la regla de accesibilidad del brief.
- **Costo:** el verde y el amarillo son más oscuros que los actuales.

### D-04 · Una escala tipográfica [0]
- **Hallazgo:** 17 tamaños distintos; títulos de página de 36 y 26 px; tablas y paneles con 10–11 px (Destinatarios, Operaciones recientes, labels del resumen). Capturas 01, 06, 12, 14.
- **Decisión:** 9 pasos (32 / 24 / 20 / 18 / 16 / 14 / 13 / 12) con roles fijos; mínimo 13 px en tablas y 12 px en pantalla; números tabulares.
- **Alternativa descartada:** dos escalas (una densa para tablas). Duplica tokens y vuelve a abrir la puerta a los 10 px.
- **Costo:** las tablas densas ganan unos 4 px por fila; se compensa con `--row-dense` 44 y menos columnas visibles.

### D-05 · Borde de inputs neutro [0]
- **Hallazgo:** todos los inputs llevan un borde navy #031634 de 1 px, más oscuro que el texto secundario. Compite con los montos, que son lo importante en una herramienta de tesorería. Capturas 01, 03.
- **Decisión:** `--color-border-input` #B4BAC8; foco con anillo de 2 px en primario; error con borde `danger-dot`.
- **Alternativa descartada:** conservar el navy como firma visual. Es el desvío más visible; se revierte cambiando un token.
- **Costo:** los campos vacíos se perciben más suaves; el label en 500 y el placeholder sostienen la affordance.

### D-06 · Tabs con subrayado; sin tabs en Operar [0]
- **Hallazgo:** las tabs son tarjetas a todo lo ancho (01, 06, 11); en Control cada tab ocupa media pantalla y en Operar el tipo de operación (Comprar / Vender / Transferir) lo elige el usuario a mano aunque se deduce de origen y destino (sección 5 de la consigna).
- **Decisión:** Operar no tiene tabs: el tipo, el par y la punta se deducen en `fx.ts` y se muestran como resultado. En las demás vistas, tabs con subrayado de 2 px y ancho de contenido.
- **Alternativa descartada:** mantener las tabs y preseleccionarlas. Pide una decisión antes de que el usuario tenga la información.
- **Costo:** el usuario deja de ver el "modo" arriba; el panel lo compensa con una línea de resultado ("Compras USD con MXN").

### D-07 · Un ícono y un color para la IA [0]
- **Hallazgo:** la funcionalidad de IA usa un ícono de nodos en #3D46CD (01, 06, 13) y un sparkle en #5291EE (15, 16).
- **Decisión:** lucide `sparkles` en `--color-primary`, siempre acompañado del texto de la acción.
- **Alternativa descartada:** el ícono de nodos; es menos reconocible como IA.
- **Costo:** ninguno relevante.

### D-08 · Un patrón de error y de vacío [0]
- **Hallazgo:** el vacío de búsqueda usa un título de 32 px (09); el error del panel usa ilustración, título 24 y botón outline (18); no hay errores inline de campo en las capturas.
- **Decisión:** error de campo: mensaje de 13 px en `danger-text` bajo el campo con borde `danger-dot`. Error de carga: bloque con título 16, texto 14 y botón secundario "Reintentar". Vacío: título 16 y texto 14, sin ilustración.
- **Alternativa descartada:** ilustraciones por estado. No aportan en una herramienta de tesorería y no tenemos las piezas.
- **Costo:** se pierde el carácter de la ilustración actual.

### D-09 · Las mismas acciones en cada tarjeta de cuenta [0]
- **Hallazgo:** el brief pide corregir que las tarjetas de cuenta tengan acciones distintas; en 01 se ven "Recibe" y "Detalles" **[confirmar con ui-actual.md qué variantes existen]**.
- **Decisión:** toda tarjeta de cuenta expone las mismas acciones (Recibir, Detalle) y el home tiene Pagar y Subir documento siempre visibles en el header, no por tarjeta.
- **Alternativa descartada:** acciones contextuales por divisa. Obliga a aprender cada tarjeta.
- **Costo:** alguna acción queda a un clic más.

### D-10 · Un formato por tipo de dato [0]
- **Hallazgo:** montos con y sin símbolo ($1,000.00 MXN, €500.00 EUR, 1,000,000.00 MXN), tipo de cambio con "$" y sin él, fechas en tres formatos. Capturas 01, 06, 11, 12, 14.
- **Decisión:** `format.ts` con `formatMonto` → `1,000,000.00 MXN`, `formatTdc` → `18.091183`, `formatFecha` → `05 oct 2026` y `05 oct 2026, 07:31`.
- **Alternativa descartada:** símbolo de moneda delante. "$" es ambiguo entre MXN y USD en México.
- **Costo:** ninguno; es la convención del propio Operar actual.

### D-11 · Densidad para 1440 × 900 [0]
- **Hallazgo:** medidas observadas a 1710 px de ancho: padding de página 80, inputs 46, botones 40 / 48 / 51, nav 53, filas de 40 y 70. A 1440 con un panel de 440 no entra el home del brief.
- **Decisión:** página 40, inputs 44, botones 40 (48 solo el CTA principal), nav 44, filas 44 / 56.
- **Alternativa descartada:** mantener las medidas actuales y hacer scroll. La posición por divisa dejaría de verse entera arriba del pliegue.
- **Costo:** menos aire que el producto actual; se compensa con la regla de contenedores (D-12).

### D-12 · Tres niveles de contenedor [0]
- **Hallazgo:** el brief pide evitar el kit de tarjetas iguales con la misma sombra; hoy todo bloque es una tarjeta blanca sobre gris (01).
- **Decisión:** protagonista (posición por divisa) en superficie blanca con borde y `shadow-card`; secundarios (movimientos, TDC, cuentas, lo nuevo) sin tarjeta, con separadores sutiles; flotantes (panel, modal) con `shadow-panel`.
- **Alternativa descartada:** tarjetas para todo, como hoy. Nada destaca.
- **Costo:** el gris de fondo queda más expuesto; se cuida el ritmo con los espaciados.

### D-13 · Un estilo de link [0]
- **Hallazgo:** links grises subrayados ("Ver tutorial"), negros subrayados ("Horarios de operación", nombres en tablas) y botones outline para lo mismo. Capturas 01, 06.
- **Decisión:** links en `--color-primary`, subrayado al hover; dentro de tablas la fila completa es clicable y no se subraya el nombre.
- **Alternativa descartada:** negro subrayado. No se distingue de texto enfatizado.
- **Costo:** ninguno.

### D-14 · Foco visible y teclado en el panel [0]
- **Hallazgo:** el foco actual es un cambio de borde de 1 px a #0086FF (01), casi imperceptible sobre el borde navy.
- **Decisión:** `--focus-ring` de 2 px primario con 2 px de separación blanca en todo control; en el panel, Tab recorre pasos en orden, Enter confirma el paso, Esc cierra.
- **Alternativa descartada:** foco solo con `:focus-visible` del navegador. Varía por navegador y no cumple AA sobre gris.
- **Costo:** ninguno.

### D-15 · Entrega en HTML + handoff, no Next.js [0]
- **Hallazgo:** en este entorno no se puede crear ni correr un proyecto Next.js.
- **Decisión:** las pantallas, el tablero y /sistema se diseñan como prototipos HTML navegables; `tokens.css`, `fx.ts`, `format.ts`, los escenarios y los docs se escriben como archivos listos para que Claude Code arme el proyecto; se suma un paquete de handoff por pantalla.
- **Alternativa descartada:** describir las pantallas solo en texto.
- **Costo:** el prototipo publicado en Vercel se arma en la etapa 4 desde el handoff, no desde estos archivos directamente.

---

## Revisión al recibir el DS oficial (6 oct 2026)

### D-16 · Adoptar el DS oficial y retirar el provisional [0]
- **Hallazgo:** llegaron el paquete `colors_and_type.css` + `ui_kit.html` y la skill v7.1 con valores verificados en Figma. Cubren tokens, componentes atómicos, tarjeta de cuenta, sidebar, header e íconos.
- **Decisión:** `src/styles/tokens.css` = copia literal de `colors_and_type.css` + capa de alias `--app-*`. Los componentes consumen solo alias. Documentación en `docs/design-system.md`.
- **Alternativa descartada:** fusionar mis tokens provisionales con los oficiales. Dos fuentes de verdad.
- **Costo:** se pierden los ajustes de contraste del provisional; se recuperan como reglas de uso (D-18).

Estado de las decisiones anteriores:
- **D-01 revertida.** El DS define dos tintas distintas por regla: indigo #3D46CC para acción y #0086FF para foco / activo / ON. Se aplica tal cual y se documenta la tabla de uso para que sea predecible.
- **D-02 ajustada.** Grey2 #8492A6 se mantiene como token (placeholder); el texto secundario informativo usa Grey1 #5B5B64 (ver D-18).
- **D-03 ajustada.** Familias de feedback = las del DS (tags y alerts de Figma). Los puntos no llegan a 3:1; regla: el punto nunca va solo.
- **D-04 ajustada.** Escala = Text Styles de Figma (32 / 24 / 20 / 16 / 14 / 12 / 10). Se mantiene la regla del brief: en tablas solo 14.
- **D-05 revertida.** Borde de inputs 0.5 px #021734 y activo 1 px #0086FF, como el DS.
- **D-06 ajustada.** Tabs del DS (subrayado 2 px #0086FF sobre #F6FBFF, ancho de contenido). Operar sigue sin tabs: el tipo se deduce de origen y destino.
- **D-07 mantenida.** Un ícono de IA; placeholder `uil-lightbulb-alt` hasta recibir el custom de Figma.
- **D-08, D-09, D-10, D-13 mantenidas** (patrón de error y vacío, acciones iguales en tarjetas, formatos únicos, un estilo de link en #0086FF como marca el DS).
- **D-11 ajustada.** Alturas del DS: inputs 48, botones 28 / 36 / 40, nav 40, header 48, main padding 32. Filas de tabla 44 (sin valor en el DS).
- **D-12 mantenida.** Tres niveles de contenedor con Shadow Mid / `--shadow-lg`.
- **D-14 ajustada.** Foco: borde #0086FF en inputs (DS) + `outline` 2 px #0086FF en el resto (alias propio).

### D-17 · Íconos Unicons en vez de lucide-react [0]
- **Hallazgo:** el pedido fijaba lucide-react; el DS oficial usa Unicons Line (CDN y `@iconscout/react-unicons`), con catálogo nombre → clase.
- **Decisión:** Unicons, para que las pantallas coincidan con el producto y el DS. **[confirmar]**
- **Alternativa descartada:** lucide con mapeo manual; dos sets de íconos conviviendo.
- **Costo:** dependencia nueva; los íconos custom de Valiu (IA, Convert) siguen necesitando export de Figma.

### D-18 · Reglas de accesibilidad por encima del DS [0]
- **Hallazgo:** Grey2 #8492A6 (3.2:1) y Light #7A7A92 (4.2:1) se usan como texto en el DS; los puntos de estado quedan bajo 3:1; no hay foco visible fuera de inputs.
- **Decisión:** sin crear colores: Grey1 para texto secundario informativo, Grey2 solo en placeholders; código de divisa en tablas en Grey1; `:focus-visible` con outline #0086FF; estado siempre con texto.
- **Alternativa descartada:** oscurecer los tokens del DS. Rompería la fidelidad y el reemplazo limpio.
- **Costo:** algunas superficies se ven una pizca más oscuras que el kit.

---

## Flujo principal en alta fidelidad (6 oct 2026)

### D-19 · Color de signo: verde para entradas, tinta para salidas [flujo]
- **Hallazgo:** el brief pide "color de signo". Si cada pago saliente va en rojo, el "Faltan 1,000.00" de la posición (el único dato de peligro real) deja de destacar y la tarjeta USD tiene dos rojos.
- **Decisión:** `+` en `--success-strong` #177B4B; `−` en `--ink-900` con el signo "−" explícito; `--danger` #B40909 reservado para faltantes.
- **Alternativa descartada:** `−` en rojo. Reversible cambiando un color en FilaMovimiento.
- **Costo:** las salidas se distinguen solo por el signo.

### D-20 · La consecuencia de cada origen va en badge [flujo]
- **Hallazgo:** "en verde" / "en ámbar" como color de texto no cumple AA (el ámbar #C78F00 da 2.9:1) y contradice "estados siempre en badge".
- **Decisión:** la consecuencia es un tag Success / Warning / Neutral del DS con texto en #151522.
- **Alternativa descartada:** texto coloreado con punto. Menos legible y sin forma propia.
- **Costo:** la OpcionOrigen crece una línea (3 líneas por opción).

### D-21 · La confirmación vive en el panel [flujo]
- **Hallazgo:** el brief no dice si la confirmación es página o panel; Operar ya no es una página.
- **Decisión:** frame 06 es el mismo PanelOperar con el home actualizado detrás; "Volver al inicio" lo cierra y muestra el aviso (07).
- **Alternativa descartada:** página completa de confirmación. Saca al usuario del contexto que acaba de resolver.
- **Costo:** el comprobante se descarga desde el panel; no hay URL propia.

### D-22 · Sin stepper en el panel [flujo]
- **Hallazgo:** el flujo tiene tres pasos reales (origen, revisión, precio y token) y el brief no pide indicador.
- **Decisión:** sin stepper; el título y el subtítulo del panel (destinatario, monto, vencimiento, referencia) sostienen el contexto y el footer dice qué sigue.
- **Alternativa descartada:** stepper vertical como en el producto (captura 13). Suma altura y repite información.
- **Costo:** el usuario no ve cuántos pasos faltan; se puede agregar si la prueba de usabilidad lo pide.

### D-24 · Pestañas Posición consolidada / Operar en el home [flujo]
- **Hallazgo:** con Operar convertido en panel, no quedaba un lugar para la operación libre (comprar, vender o transferir sin un pago cargado), que es lo que el producto actual resuelve en su página Operar.
- **Decisión:** el home tiene dos pestañas: Posición consolidada (la propuesta) y Operar (el formulario actual llevado al DS, con Mis cuentas al lado). El panel sigue siendo el camino desde un pago cargado o desde el faltante.
- **Alternativa descartada:** Operar como ítem del menú. Duplica la navegación y saca la operación del contexto de la posición.
- **Costo:** dos formas de operar (panel y formulario) que hay que mantener coherentes; a futuro el formulario puede migrar al panel.

### D-26 · Onboarding contextual de 4 pasos [flujo]
- **Hallazgo:** el home cambia de "formulario Operar" a "posición por divisa + panel"; el usuario actual necesita entender qué gana y saber que puede seguir operando como antes.
- **Decisión:** recorrido de 4 pasos sobre la pantalla real (posición, movimientos, tipo de cambio, pestaña Operar clásico), con recorte sobre cada elemento, Atrás / Siguiente, cierre en cualquier momento y "Empezar" al final. El último paso es la red de seguridad: Operar clásico.
- **Alternativa descartada:** modal de bienvenida con capturas. No muestra los elementos en su lugar y se cierra sin leer.
- **Costo:** cuatro textos que mantener cuando cambie el home; se muestra una sola vez.

### D-25 · Operar: mismos campos, patrones corregidos [flujo]
- **Hallazgo:** el Operar actual (capturas 01–03) pide elegir el tipo antes que los datos, muestra "Ingresar token" deshabilitado desde el inicio con un aviso de 15 segundos, abre un modal para el destinatario, no valida saldo y lleva al usuario a la página de Banco BASE para el token.
- **Decisión:** conservar la estructura (tabs, par, montos, origen/destino, motivo, cotización con TDC Valiu, Mis cuentas) y corregir los patrones: un solo CTA que cambia de "Pedir precio" a "Confirmar", TDC indicativo visible desde el inicio, selector de destino con buscador y grupos en lugar del modal, error inline de saldo, precio fijo con cuenta regresiva y token dentro del formulario, transferencias sin TDC, mercado cerrado con aviso y "Programar" como Futuro.
- **Alternativa descartada:** reemplazar el formulario por el panel de pasos. El panel resuelve el pago precargado; el formulario sigue siendo la operación libre que el usuario ya conoce. Pueden converger después.
- **Costo:** dos superficies de operación que mantener coherentes (mismos CampoToken, CajaTdcValiu y badges).

### D-23 · Badge solo para estados no finales [flujo]
- **Hallazgo:** los movimientos realizados del brief no traen estado; el único estado definido es "En proceso" del pago recién enviado.
- **Decisión:** FilaMovimiento muestra badge solo cuando el estado no es final (En proceso, Por autorizar…); lo confirmado no lleva badge.
- **Alternativa descartada:** "Confirmado" en todas las filas. Ruido que iguala lo pendiente con lo cerrado.
- **Costo:** ninguno.


---

## Fecha valor (6 oct 2026)

### D-27 · Fecha valor en la revisión [fecha valor]
- **Hallazgo:** Valiu está por liberar la elección de cuándo sale el dinero: el precio se cierra hoy y el dinero sale hoy o en los próximos tres días hábiles.
- **Decisión:** FechaLiquidacion (segmented del DS) en la revisión, debajo de los montos y antes de pedir precio. Fechas reales ("Hoy", "mié 7", "jue 8", "vie 9"), Hoy por defecto, "vence" en el día de vencimiento del pago, oculto sin tipo de cambio. Si la fecha no es hoy, la operación queda "Pactada" (estado del historial) y la posición en pesos suma la fila "Pactadas por liquidar".
- **Alternativa descartada:** elegir la fecha junto al token. Cambiaría un precio ya fijado y obligaría a pedir otro.
- **Costo:** la revisión suma un bloque. Va sin etiqueta "Futuro" porque Valiu la libera en el corto plazo (confirmar).

### D-28 · Segmented: selección con el color del Figma [fecha valor]
- **Hallazgo:** el segmented del paquete (preview/segmented-button.html) marca la opción elegida con texto #0086FF sobre #F6FBFF (≈ 3.5:1, no llega a AA); el snippet verificado en Figma usa #3D46CC (≈ 6.9:1).
- **Decisión:** contenedor del paquete (#F5F7FA, píldora, padding 4, gap 4, Shadow Mid) y opción elegida del Figma: fondo #F6FBFF, borde 1 px #3D46CC, texto 600 #3D46CC. No elegidas en Grey1 #5B5B64 (D-18).
- **Alternativa descartada:** el #0086FF del paquete.
- **Costo:** ninguno; es el mismo lenguaje que la OpcionOrigen seleccionada.

### D-29 · Badge "Pactada" sin mint [fecha valor]
- **Hallazgo:** el historial muestra "Pactada" con punto azul; el tag Info del DS usa fondo mint #E8F7F9, que todavía no usamos.
- **Decisión:** fondo #EDF3FF (Main/V40) y punto #0086FF. En Próximos reemplaza al link "Pagar" y la fila suma el monto en pesos y el TDC.
- **Costo:** cuando entre el mint, se cambia el token del badge Info.
