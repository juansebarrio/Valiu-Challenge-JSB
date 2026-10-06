# Valiu Design System — Tokens

## TIPOGRAFÍA

- **Familia**: `Montserrat`
- **Import**: `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap`

| Rol | Size | Weight | Line Height | Notas |
|-----|------|--------|-------------|-------|
| Headline XL | 24px | 600 | 24px | |
| Headline L | 20px | 600 | 24px | |
| Body 1 Bold | 16px | 600 | 16px | |
| Body 1 Regular | 16px | 400 | 16px | |
| Body 2 Bold | 14px | 600 | 16px | |
| Body 2 Regular | 14px | 400 | 16px | |
| Caption Bold | 12px | 700 | normal | |
| Caption Regular | 12px | 400 | 12px | |
| Overline Bold | 10px | 600 | 8px | letter-spacing: 1.5px |
| Overline Regular | 10px | 400 | 8px | letter-spacing: 1.5px |

---

## PALETA DE COLORES

### Marca principal

| Token | Hex | Uso principal |
|-------|-----|---------------|
| `Main/Dark Blue` | `#3D46CC` | Primary button, border alert info, Secondary button border |
| `Main/Core Valiu Light` | `#0086FF` | ⚠️ Input Active border, FAB hover, Checkbox/Switch ON — DISTINTO al primario |
| `Main/V20` | `#F6FBFF` | Nav activo bg, tab activo bg, Secondary hover bg |
| `Main/V40` | `#EDF3FF` | Hover suave, fondos selección secundaria |
| `Main/V60` | `#8BCAFB` | Tag Descriptive dot, estados intermedios |
| `Main/V80` | `#4D9EF7` | Acentos azul medio, gráficas |
| `Main/Dark Navy` | `#1C293B` | Label título de inputs |
| `Main/Navy` | `#021734` | Border input Empty/Filled |
| `Neutral/V Black` | `#151522` | Texto principal, input filled |
| `Neutral/White` | `#FFFFFF` | Cards, modales, inputs bg |
| `Greyscale/Grey1` | `#5B5B64` | Texto secundario |
| `Greyscale/Grey2` | `#8492A6` | Placeholder, subtexto |
| `Greyscale/Grey3` | `#DCDCDE` | Border y texto botones Inactive |
| `Greyscale/Grey4` | `#F5F7FA` | Bg botones Inactive/Deactivated |
| `Greyscale/Light` | `#7A7A92` | Currency code en inputs |
| Background page | `#F5F6F8` | Fondo de app |
| Border / Divider | `#E2E4E9` | Separadores, dividers |
| Selected bg | `#F0F1FD` | Item seleccionado en listas |

### Feedback

| Tipo | bg tag/small | bg alert | dot | border alert |
|------|-------------|----------|-----|--------------|
| Success | `#EBFFF6` | `#D5F3E6` | `#82DAB5` | `#17714B` |
| Warning | `#FCEFCE` | `#FCEFCE` | `#F5CE6C` | `#C78F00` |
| Error | `#FFF1F1` | `#F0CECE` | `#D26B6B` | `#770505` |
| Info | `#E8F7F9` | — | `#8BCAFB` | `#3D46CC` |
| Neutral | `#F5F7FA` | — | `#8492A6` | — |

---

## ESPACIADO Y GEOMETRÍA

| Propiedad | Valor |
|-----------|-------|
| Border radius — inputs, cards, alerts, dropdowns | `8px` |
| Border radius — botones Primary / Secondary | `4px` |
| Border radius — tags Big (pill) | `16px` |
| Border radius — Floating button | `40px` |
| Border input Empty/Filled | `0.5px solid #021734` |
| Border input Active (focus) | `1px solid #0086FF` |
| Border Secondary button | `1px solid #3D46CC` |
| Padding inputs | `12px` |
| Padding Primary/Secondary Large | `8px 16px` |
| Padding Primary/Secondary Mid | `4px 16px` |
| Padding alerts | `16px`, gap `16px` |
| Shadow Mid | `0px 3px 6px rgba(0,0,0,0.08)` |
| Shadow High | `0px 3px 6px rgba(0,0,0,0.15)` |
| Input height | `48px` min-height |

---

## LAYOUT BASE

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.0/css/line.css">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Montserrat',sans-serif;background:#F5F6F8;color:#151522;display:flex;flex-direction:column;min-height:800px;width:1280px;}
  </style>
</head>
<body>
  <!-- header 48px -->
  <!-- div.app-body: display:flex -->
    <!-- nav.sidebar: 64px cerrado / 240px abierto -->
    <!-- main: flex:1, padding:32px -->
</body>
</html>
```

### Sidebar tokens

| Estado | Width | Bg | Border |
|--------|-------|----|--------|
| Closed | `64px` | `#FFFFFF` | `border-right: 0.5px solid #E2E4E9` |
| Open | `240px` | `#FFFFFF` | `border-right: 0.5px solid #E2E4E9` |

| Nav item | Bg | Color texto | Ícono |
|----------|----|----|-------|
| Activo | `#F6FBFF` | `#0086FF` 14px/600 | stroke `#0086FF` |
| Hover | `#F6FBFF` | `#151522` | stroke `#151522` |
| Inactivo | transparent | `#151522` 14px/500 | stroke `#151522` |

Tamaños de íconos en sidebar: `16×16px` cerrado · `18×18px` abierto

---

## ÍCONOS — SISTEMA OFICIAL (verificado con Figma MCP)

### Descubrimiento importante
Los íconos del DS de Valiu en Figma están almacenados como **imágenes rasterizadas**, no como SVG paths vectoriales. El enfoque de sprite SVG con `<use href="#id">` **no funciona** para estos íconos.

**La solución correcta:** los íconos son de la librería **Unicons Line** (open source de Iconscout). Se cargan via CDN en una línea.

### Cómo usar en prototipos HTML

```html
<!-- En el <head> — carga todos los íconos Unicons -->
<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.0/css/line.css">

<!-- Uso básico — color via style, tamaño via font-size -->
<i class="uil uil-calculator" style="font-size:18px;color:#0086FF;"></i>
<i class="uil uil-bell" style="font-size:24px;color:#151522;"></i>
<i class="uil uil-info-circle" style="font-size:14px;color:#8492A6;"></i>
```

### Tamaños estándar por contexto
| Contexto | font-size |
|---|---|
| Sidebar closed | `18px` |
| Acciones generales | `24px` |
| Dashboard / módulos | `20px` |
| Inputs / labels | `16px` |
| Info / tooltip | `14px` |

### Catálogo — nombre DS → clase Unicons

#### Navegación sidebar
| DS | Unicons |
|---|---|
| calculator | `uil-calculator` |
| calender | `uil-calender` |
| chart | `uil-chart` |
| credit-card | `uil-credit-card` |
| sign-alt | `uil-sign-alt` |

#### Chevrons y flechas
| DS | Unicons |
|---|---|
| angle-right-b | `uil-angle-right-b` |
| angle-down-b | `uil-angle-down-b` |
| angle-up-b | `uil-angle-up-b` |
| angle-left-b | `uil-angle-left-b` |
| arrow-left | `uil-arrow-left` |
| arrow-right | `uil-arrow-right` |
| arrow-down | `uil-arrow-down` |
| arrow-up | `uil-arrow-up` |

#### Acciones comunes
| DS | Unicons |
|---|---|
| search | `uil-search` |
| add | `uil-plus` |
| delete | `uil-trash-alt` |
| edit-alt | `uil-edit-alt` |
| download | `uil-download-alt` |
| export | `uil-export` |
| cancel | `uil-times` |
| check-circle | `uil-check-circle` |
| visibility | `uil-eye` |
| visibility-off | `uil-eye-slash` |
| redo | `uil-redo` |
| share-alt | `uil-share-alt` |
| content-copy | `uil-copy` |
| star | `uil-star` |
| favorite | `uil-heart` |
| bars | `uil-bars` |
| filter | `uil-filter` |
| more (⋮) | `uil-ellipsis-v` |

#### Finanzas
| DS | Unicons |
|---|---|
| money-withdraw | `uil-money-withdraw` |
| attach-money | `uil-dollar-sign` |
| chart-line | `uil-chart-line` |
| bank | `uil-university` |
| ticket | `uil-ticket` |
| bag | `uil-bag` |
| credit-card-search | `uil-credit-card-search` |

#### Comunicación / Info
| DS | Unicons |
|---|---|
| whatsapp | `uil-whatsapp` |
| mail | `uil-envelope` |
| bell | `uil-bell` |
| info | `uil-info-circle` |
| question-circle | `uil-question-circle` |
| comment-alt-lock | `uil-comment-alt-lock` |
| lightbulb-alt | `uil-lightbulb-alt` |

#### Tiempo
| DS | Unicons |
|---|---|
| calendar-alt | `uil-calendar-alt` |
| clock-ten | `uil-clock-ten` |

#### Seguridad / Auth
| DS | Unicons |
|---|---|
| shield | `uil-shield` |
| signout | `uil-signout` |

#### Documentos
| DS | Unicons |
|---|---|
| file-alt | `uil-file-alt` |
| passport | `uil-passport` |

#### Sistema
| DS | Unicons |
|---|---|
| cog | `uil-cog` |
| wifi-off | `uil-wifi-slash` |
| sitemap | `uil-sitemap` |
| user | `uil-user` |
| map-pin-alt | `uil-map-pin-alt` |

#### Íconos custom Valiu (sin equivalente en Unicons)
Para estos usar SVG inline manual o imagen exportada desde Figma:
`Dashboard` (node: `876:8983`) · `Márgenes` (node: `880:8987`) · `Seguir divisa` (node: `122:1865`) · `More` (node: `782:5532`) · `Destinatario` (node: `886:8997`) · `Factura` (node: `3982:692`) · `Huella` (node: `4084:694`) · `Ai` (node: `4345:745`) · `Convert` (node: `4344:738`) · `Interests` (node: `4159:2243`) · `Rendimiento` (node: `4254:736`) · `Onboarding` (node: `885:8993`) · `Carga masiva` (node: `3996:705`)

Para obtener el SVG exacto de cualquiera de estos: llamar `get_design_context` con el node ID correspondiente.
