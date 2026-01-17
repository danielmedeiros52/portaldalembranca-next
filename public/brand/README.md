# Brand Assets - Portal da Lembrança

Este diretório contém os assets oficiais da marca Portal da Lembrança.

## Arquivos Disponíveis

### Logos Light Mode (para fundos claros)

| Arquivo | Descrição | Uso Recomendado |
|---------|-----------|-----------------|
| `logo-icon.png` | Ícone do coração com QR Code | Foto de perfil, favicon, avatares |
| `logo-horizontal.png` | Logo horizontal com texto | Cabeçalhos, e-mails, banners horizontais |
| `logo-vertical.png` | Logo vertical empilhada | Stories, banners verticais, totens |

### Logos Dark Mode (para fundos escuros)

| Arquivo | Descrição | Uso Recomendado |
|---------|-----------|-----------------|
| `logo-icon-dark.png` | Ícone para modo escuro | Interfaces dark mode |
| `logo-horizontal-dark.png` | Logo horizontal dark | Sites com tema escuro |
| `logo-vertical-dark.png` | Logo vertical dark | Materiais com fundo escuro |

### Outros Assets

| Arquivo | Descrição |
|---------|-----------|
| `qrcode.png` | QR Code que leva para portaldalembranca.com |

## Paleta de Cores

- **Teal Sereno**: #008080 (cor primária)
- **Rosa Aconchego**: #D8BFD8 (cor secundária)
- **Cinza Sóbrio**: #4F4F4F (textos)
- **Branco Neve**: #FFFFFF (fundos)
- **Dourado Legado**: #DAA520 (detalhes especiais)

## Tipografia

- **Títulos**: Playfair Display (serif)
- **Corpo de texto**: Lato (sans-serif)

## Uso

Importe as constantes do arquivo `client/src/const.ts`:

```typescript
import { 
  APP_LOGO, 
  APP_LOGO_HORIZONTAL, 
  APP_LOGO_VERTICAL,
  APP_LOGO_DARK,
  APP_LOGO_HORIZONTAL_DARK,
  APP_LOGO_VERTICAL_DARK
} from "@/const";
```

## Diretrizes

- Não distorça as proporções das logos
- Mantenha espaçamento adequado ao redor
- Use a versão dark em fundos escuros
- Não altere as cores da identidade visual
