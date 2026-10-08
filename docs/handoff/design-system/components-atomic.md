# Valiu DS — Componentes Atómicos

Snippets HTML canónicos extraídos del Figma oficial (`O1FiqHWikxySbGwwvRFJQe`).
Para componentes complejos de pantalla → consultar Figma MCP primero (ver SKILL.md Paso 2A).

---

## BOTONES

### Primary Large
```html
<!-- Default -->
<button style="background:#3D46CC;color:#FFF;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:none;cursor:pointer;">Acción</button>
<!-- Hover -->
<button style="background:#0086FF;color:#FFF;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:none;cursor:pointer;box-shadow:0px 3px 6px rgba(0,0,0,0.08);">Acción</button>
<!-- Inactive -->
<button disabled style="background:#F5F7FA;color:#DCDCDE;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:none;cursor:not-allowed;">Acción</button>
```

### Primary ExtraLarge
```html
<button style="background:#3D46CC;color:#FFF;font-family:'Montserrat',sans-serif;font-size:16px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:none;cursor:pointer;">Acción</button>
```

### Secondary Large
```html
<!-- Default -->
<button style="background:#FFF;color:#3D46CC;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:1px solid #3D46CC;cursor:pointer;">Acción</button>
<!-- Inactive -->
<button disabled style="background:#F5F7FA;color:#DCDCDE;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;line-height:24px;padding:8px 16px;border-radius:4px;border:1px solid #DCDCDE;cursor:not-allowed;">Acción</button>
```

### Link Button
```html
<button style="background:none;color:#151522;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;text-decoration:underline;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;">Acción <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3L7.5 6L4.5 9" stroke="#151522" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
```

### Floating Button (WhatsApp / Contáctanos)
```html
<div style="background:#FFF;border:1px solid #3D46CC;border-radius:40px;padding:8px 12px;display:inline-flex;align-items:center;gap:4px;box-shadow:0px 3px 6px rgba(0,0,0,0.15);cursor:pointer;">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.6 2.33A7.85 7.85 0 0 0 8 0C3.63 0 .07 3.56.06 7.93c0 1.4.37 2.76 1.06 3.96L0 16l4.2-1.1A7.93 7.93 0 0 0 8 15.9h.004c4.37 0 7.93-3.56 7.93-7.93A7.9 7.9 0 0 0 13.6 2.33z" fill="#3D46CC"/></svg>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;color:#3D46CC;">Contáctanos</span>
</div>
```

### FAB — Floating Action Button vertical
Nodo Figma: `2180:760`. Ícono centrado + label debajo. Área de toque `56×56px`.

| Tipo | Default bg | Hover bg | Inactive bg | Border |
|------|-----------|----------|-------------|--------|
| Primary | `#3D46CC` | `#0086FF` | `#F5F7FA` | — |
| Secondary | `#FFFFFF` | `#F6FBFF` | `#F5F7FA` | `1px solid #3D46CC` |
| Tertiary | `#FFFFFF` | `#F5F7FA` | `#F5F7FA` | — |

```html
<!-- FAB Primary Default -->
<div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;">
  <div style="background:#3D46CC;border-radius:8px;padding:16px;box-shadow:0px 3px 6px rgba(0,0,0,0.15);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
    <i class="uil uil-calculator" style="font-size:24px;color:white;"></i>
  </div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;">Operar</span>
</div>

<!-- FAB Secondary Default -->
<div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;">
  <div style="background:#FFFFFF;border:1px solid #3D46CC;border-radius:8px;padding:16px;box-shadow:0px 3px 6px rgba(0,0,0,0.15);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
    <i class="uil uil-calender" style="font-size:24px;color:#3D46CC;"></i>
  </div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;">Planificar</span>
</div>
```

---

## INPUTS

### Input de texto — 3 estados
```html
<!-- Empty -->
<div style="display:flex;flex-direction:column;gap:8px;width:100%;">
  <label style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;color:#1C293B;">Título</label>
  <div style="border:0.5px solid #021734;border-radius:8px;padding:12px;display:flex;align-items:center;background:#FFF;min-height:48px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#8492A6;">Placeholder</span>
  </div>
</div>

<!-- Active (focus) -->
<div style="display:flex;flex-direction:column;gap:8px;width:100%;">
  <label style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;color:#1C293B;">Título</label>
  <div style="border:1px solid #0086FF;border-radius:8px;padding:12px;display:flex;align-items:center;background:#FFF;min-height:48px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#151522;">Texto</span>
  </div>
</div>

<!-- Filled -->
<div style="display:flex;flex-direction:column;gap:8px;width:100%;">
  <label style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;color:#1C293B;">Título</label>
  <div style="border:0.5px solid #021734;border-radius:8px;padding:12px;display:flex;align-items:center;background:#FFF;min-height:48px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#151522;">Valor</span>
  </div>
</div>
```

### Dropdown Input
```html
<div style="display:flex;flex-direction:column;gap:8px;width:100%;position:relative;">
  <label style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;color:#1C293B;">Etiqueta</label>
  <div style="border:0.5px solid #021734;border-radius:8px;padding:12px;display:flex;align-items:center;justify-content:space-between;background:#FFF;min-height:48px;cursor:pointer;gap:16px;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#8492A6;flex:1;">Seleccionar</span>
    <i class="uil uil-angle-down" style="font-size:18px;color:#151522;flex-shrink:0;"></i>
  </div>
</div>
```

### Input con currency (Compras/Pagas)
Usado en el form Operar. Split input con dos mitades separadas por divisor interno.
```html
<!-- Split input — estado Active (border azul) -->
<div style="display:flex;border:1.5px solid #0086FF;border-radius:8px;overflow:hidden;">
  <!-- Mitad izquierda -->
  <div style="flex:1;display:flex;align-items:center;padding:0 12px;height:48px;gap:6px;border-right:1px solid #E2E4E9;background:#FFF;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#151522;flex:1;">50,000.00</span>
    <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#7A7A92;">USD</span>
  </div>
  <!-- Mitad derecha -->
  <div style="flex:1;display:flex;align-items:center;padding:0 12px;height:48px;gap:6px;background:#FFF;">
    <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#151522;flex:1;">895,148.70</span>
    <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#7A7A92;">MXN</span>
  </div>
</div>
```

---

## FEEDBACK

### Tags / Badges
Estructura: dot `8px` + texto. Small = `border-radius:8px`. Big/pill = `border-radius:16px`.

```html
<!-- Success Big pill -->
<div style="background:#EBFFF6;border-radius:16px;padding:4px 16px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#17714B;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Mercado abierto</span>
</div>

<!-- Error Big pill -->
<div style="background:#FFF1F1;border-radius:16px;padding:4px 16px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#D26B6B;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Error</span>
</div>

<!-- Warning Big pill -->
<div style="background:#FCEFCE;border-radius:16px;padding:4px 16px 4px 8px;display:inline-flex;align-items:center;gap:6px;">
  <div style="width:8px;height:8px;border-radius:50%;background:#F5CE6C;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:#151522;">Mercado cerrado</span>
</div>
```

### Alerts (4 tipos)
```html
<!-- Informativo -->
<div style="background:#E8F7F9;border:1px solid #3D46CC;border-radius:8px;padding:16px;display:flex;align-items:flex-start;gap:16px;">
  <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
    <p style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:600;color:#151522;">Título</p>
    <p style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;">Descripción.</p>
  </div>
  <button style="background:none;border:none;cursor:pointer;width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2L14 14M14 2L2 14" stroke="#151522" stroke-width="1.5" stroke-linecap="round"/></svg>
  </button>
</div>
```

---

## CONTROLES

### Tabs
```html
<div style="display:flex;border-bottom:1px solid #E2E4E9;">
  <!-- Active -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#F6FBFF;border-bottom:2px solid #0086FF;padding:14px 16px;cursor:pointer;">
    <span style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:600;color:#151522;">Comprar</span>
  </div>
  <!-- Inactive -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#FFF;padding:14px 16px;cursor:pointer;border-bottom:2px solid transparent;">
    <span style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:400;color:#5B5B64;">Vender</span>
  </div>
</div>
```

### Checkbox — 3 estados
⚠️ Checked usa `#0086FF`, NO `#3D46CC`.
```html
<!-- Checked -->
<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
  <div style="width:16px;height:16px;border-radius:4px;background:#0086FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#151522;">Action</span>
</label>
<!-- Empty -->
<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
  <div style="width:16px;height:16px;border-radius:4px;border:1px solid #8492A6;background:#FFFFFF;flex-shrink:0;"></div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#5B5B64;">Action</span>
</label>
```

### Switch — 3 estados
⚠️ On usa `#0086FF`. Thumb siempre blanco. Dimensiones: `24×12px`.
```html
<!-- On -->
<div style="width:24px;height:12px;border-radius:40px;background:#0086FF;display:flex;align-items:center;justify-content:flex-end;padding:2px;cursor:pointer;">
  <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
</div>
<!-- Off -->
<div style="width:24px;height:12px;border-radius:40px;background:#DCDCDE;display:flex;align-items:center;justify-content:flex-start;padding:2px;cursor:pointer;">
  <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
</div>
```

---

## NAVEGACIÓN

### Header webapp — estado normal
Nodo Figma: `3622:44874`. Altura `48px`.
```html
<header style="width:100%;height:48px;background:#FFFFFF;border-bottom:0.5px solid #E2E4E9;display:flex;align-items:center;padding:0 24px 0 16px;justify-content:space-between;flex-shrink:0;">
  <!-- Logo mark -->
  <div style="width:28px;height:28px;background:#151522;border-radius:5px;display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="white"/>
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="white"/>
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="white"/>
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="white" opacity="0.35"/>
    </svg>
  </div>
  <!-- Right actions -->
  <div style="display:flex;align-items:center;gap:20px;">
    <!-- Contáctanos WhatsApp -->
    <div style="display:flex;align-items:center;gap:6px;cursor:pointer;">
      <i class="uil uil-whatsapp" style="font-size:16px;color:#151522;"></i>
      <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;color:#151522;">Contáctanos</span>
    </div>
    <i class="uil uil-bell" style="font-size:18px;color:#151522;cursor:pointer;"></i>
    <div style="width:30px;height:30px;border-radius:50%;background:#F6FBFF;border:1.5px solid #3D46CC;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      <span style="font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;color:#3D46CC;">M</span>
    </div>
  </div>
</header>
```

### Breadcrumbs
```html
<nav style="display:flex;align-items:center;">
  <div style="display:flex;align-items:center;cursor:pointer;">
    <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#8492A6;">Inicio</span>
    <i class="uil uil-angle-right-b" style="font-size:16px;color:#8492A6;"></i>
  </div>
  <span style="font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;color:#151522;">Página actual</span>
</nav>
```

### Chips / Segmented button
```html
<!-- Selected -->
<div style="background:#F6FBFF;border:1px solid #3D46CC;border-radius:24px;padding:8px 16px;display:inline-flex;align-items:center;cursor:pointer;">
  <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:600;color:#3D46CC;">Filtro</span>
</div>
<!-- Unselected -->
<div style="border-radius:24px;padding:8px 16px;display:inline-flex;align-items:center;cursor:pointer;">
  <span style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:400;color:#8492A6;">Filtro</span>
</div>
```

---

## NOTAS CRÍTICAS

- `#3D46CC` = primario · `#0086FF` = focus/hover/active — son tokens DISTINTOS, nunca intercambiarlos
- Border inputs Empty/Filled: `0.5px solid #021734` — NO `#E2E4E9`
- Checkbox/Switch ON: `#0086FF` — NO `#3D46CC`
- Primary hover: `#0086FF` · Secondary hover: bg `#F6FBFF` + border `#3D46CC`
- Border-radius SOLO: `4px` (botones), `8px` (inputs/cards), `16px` (tags-pill), `40px` (floating)
