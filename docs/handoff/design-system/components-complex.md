# Valiu DS — Componentes Complejos

⚠️ **IMPORTANTE:** Estos snippets son puntos de partida basados en observación de screenshots.
Para valores exactos de dimensiones, padding y spacing → SIEMPRE verificar con Figma MCP antes de generar.
Ver SKILL.md Paso 2A para el proceso.

---

## MIS CUENTAS — Panel lateral

**Node IDs verificados en Figma:**
- Panel completo (Operar): `1350:1822`
- Card cuentas Compact: `4475:1695` (246px)
- Card cuentas Spaced: `4475:1762` (349px) ← versión usada en Operar moderno
- Página: Complex Components `133:5656`

### Tokens exactos extraídos del Figma

**Card exterior (Spaced — versión Operar actual):**
- `background: #FFFFFF`
- `border-radius: 8px`
- `box-shadow: 0px 3px 6px rgba(0,0,0,0.08)` (Shadow Mid)
- `padding: 16px 24px 12px 24px`
- `gap: 24px` entre sección superior e inferior
- `width: 349px`

**Flag container (divisa):**
- `background: #F5F7FA`
- `border-radius: 4px`
- `padding: 4px`
- `box-shadow: 0px 3px 6px rgba(0,0,0,0.08)`
- Flag image: `16×16px`

**Número de cuenta:** `12px / 400 / #151522` — alineado a la derecha

**Separador entre flag+número y balance:** `0.5px solid #E2E4E9`

**Balance:** `16px / 600 / #151522` (Heavy/Body 1) + currency `10px / 600 / #151522` (Heavy/Overline, letter-spacing 1.5px)

**Alias/nombre cuenta:** `12px / 400 / #151522`

**Botones de acción (FAB Tertiary con border):**
- Contenedor botón: `background:#FFFFFF`, `border: 1px solid #3D46CC`, `border-radius: 8px`, `padding: 8px`, `box-shadow: 0px 3px 6px rgba(0,0,0,0.15)` (Shadow High)
- Ícono: `16×16px` color `#3D46CC`
- Label: `12px / 400 / #151522`
- Gap entre botón e ícono label: `8px`
- Gap entre los dos botones: `24px`
- **Recibe** → ícono `arrow-down` (ID: `393:5551`)
- **Detalles** → ícono `add` (ID: `645:5835`)

### HTML snippet canónico (Card Spaced — Operar)
```html
<!-- Card cuentas — Spaced variant (node: 4475:1762) -->
<div style="background:#FFFFFF;border-radius:8px;box-shadow:0px 3px 6px rgba(0,0,0,0.08);padding:16px 24px 12px;display:flex;flex-direction:column;gap:24px;width:349px;">

  <!-- Sección superior: flag+número / separator / balance+alias -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <!-- Flag + número de cuenta -->
    <div style="display:flex;align-items:center;gap:4px;padding-right:8px;border-radius:4px;">
      <!-- Divisa badge -->
      <div style="background:#F5F7FA;border-radius:4px;padding:4px;box-shadow:0px 3px 6px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <!-- MX flag 16x16 -->
        <div style="width:16px;height:16px;border-radius:2px;overflow:hidden;display:flex;flex-shrink:0;">
          <div style="width:5.3px;height:16px;background:#006847;"></div>
          <div style="width:5.4px;height:16px;background:#FFFFFF;"></div>
          <div style="width:5.3px;height:16px;background:#CE1126;"></div>
        </div>
      </div>
      <!-- Número cuenta -->
      <span style="flex:1;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;text-align:right;line-height:12px;">**** 1025</span>
    </div>
    <!-- Separator -->
    <div style="height:0.5px;background:#E2E4E9;width:100%;"></div>
  </div>

  <!-- Sección inferior: balance+alias a la izq / botones a la der -->
  <div style="display:flex;align-items:flex-start;gap:24px;">
    <!-- Info: balance + alias -->
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">
      <!-- Balance + currency -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:600;color:#151522;line-height:16px;white-space:nowrap;">1,000,000.00</span>
        <span style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#151522;letter-spacing:1.5px;line-height:8px;align-self:flex-end;">MXN</span>
      </div>
      <!-- Alias -->
      <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;line-height:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Hugo Cedric nuevo alias super e...</span>
    </div>
    <!-- Botones de acción -->
    <div style="display:flex;align-items:center;gap:24px;flex-shrink:0;">
      <!-- Recibe -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;">
        <div style="background:#FFFFFF;border:1px solid #3D46CC;border-radius:8px;padding:8px;box-shadow:0px 3px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color:#3D46CC;">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;line-height:12px;">Recibe</span>
      </div>
      <!-- Detalles -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;">
        <div style="background:#FFFFFF;border:1px solid #3D46CC;border-radius:8px;padding:8px;box-shadow:0px 3px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color:#3D46CC;">
            <path d="M12 5v19M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;line-height:12px;">Detalles</span>
      </div>
    </div>
  </div>
</div>
```

---

## OPERAR — Form card

### Estructura
```
Card (white, border-radius:12px, shadow)
├── Tabs: Comprar (active) | Vender | Transferir
└── Form body padding:20px 24px 24px
    ├── "Completa los campos" + estado tag (Mercado abierto / Error / Cerrado)
    ├── Row: [Elige un par dropdown] [Compras label + Pagas label]
    │                                [split input con border active]
    ├── Row: [Origen dropdown] [Destino dropdown]
    ├── Row: [Motivo de pago dropdown] [Detalle/Referencia input]
    ├── Cotización: label | descripción
    │   └── Bar: [Tu compra] [→] [Total a pagar MXN] [TDC Valiu box]
    └── Bottom: [notice text] [Ingresar token btn disabled]
```

### Estados del mercado
```html
<!-- Mercado abierto — Success -->
<div style="background:#EBFFF6;border-radius:16px;padding:4px 12px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#17714B;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Mercado abierto</span>
</div>

<!-- Error -->
<div style="background:#FFF1F1;border-radius:16px;padding:4px 12px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#D26B6B;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Error</span>
</div>

<!-- Mercado cerrado — Warning -->
<div style="background:#FCEFCE;border-radius:16px;padding:4px 12px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#F5CE6C;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Mercado cerrado</span>
</div>
```

### TDC Valiu box — estados
```html
<!-- Con valor -->
<div style="padding:10px 16px;background:#FFFFFF;border:2px solid #0086FF;border-radius:0 7px 7px 0;display:flex;flex-direction:column;gap:3px;min-width:170px;">
  <span style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;color:#151522;">TDC Valiu</span>
  <div style="display:flex;align-items:baseline;gap:4px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700;color:#151522;">17.902974</span>
    <span style="font-family:'Montserrat',sans-serif;font-size:11px;font-weight:400;color:#8492A6;">MXN</span>
  </div>
</div>

<!-- No disponible -->
<div style="padding:10px 16px;background:#FFFFFF;border:2px solid #0086FF;border-radius:0 7px 7px 0;display:flex;flex-direction:column;gap:3px;min-width:170px;">
  <span style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;color:#151522;">TDC Valiu</span>
  <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:600;color:#3D46CC;">No disponible</span>
</div>
```

---

## SIDEBAR — Closed 64px

```html
<nav style="width:64px;background:#FFFFFF;border-right:0.5px solid #E2E4E9;display:flex;flex-direction:column;align-items:center;padding:8px 0 16px;gap:4px;flex-shrink:0;">
  <!-- Activo: bg #F6FBFF, ícono color #0086FF -->
  <div style="width:48px;height:40px;background:#F6FBFF;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-calculator" style="font-size:18px;color:#0086FF;"></i>
  </div>
  <!-- Inactivos: bg transparent, ícono color #151522 -->
  <div style="width:48px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-calender" style="font-size:18px;color:#151522;"></i>
  </div>
  <div style="width:48px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-chart" style="font-size:18px;color:#151522;"></i>
  </div>
  <div style="width:48px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-credit-card" style="font-size:18px;color:#151522;"></i>
  </div>
  <div style="width:48px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-sign-alt" style="font-size:18px;color:#151522;"></i>
  </div>
  <div style="flex:1;"></div>
  <!-- Bottom -->
  <div style="width:48px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <i class="uil uil-cog" style="font-size:18px;color:#151522;"></i>
  </div>
</nav>
```
