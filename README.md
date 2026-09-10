# BIOS Unlock Tool — Multilingual Landing Pages

## Structure
```
/
├── locales/
│   ├── en-US/      → biosunlocktool.com
│   ├── en-IN/      → legacy Hindi stub (not routed by default)
│   ├── de-DE/      → de.biosunlocktool.com
│   ├── pl-PL/      → pl.biosunlocktool.com
│   └── af-ZA/      → af.biosunlocktool.com
├── assets/
├── functions/
└── _headers
```

## Cloudflare Pages
- **Plan**: Free
- **Builds/day**: 500
- **Bandwidth**: 100GB/month
- **SSL**: Universal SSL (auto)
- **Deploy hook**: Auto-deploy on push to main

## Build Commands
```bash
npm run build        # Build all locales
npm run pages:deploy # Same as build
```

## Routes
| Domain | Locale |
|--------|--------|
| biosunlocktool.com | en-US / US canonical |
| us.biosunlocktool.com | en-US / US alias |
| ca.biosunlocktool.com | en-US / Canada English experiment |
| in.biosunlocktool.com | en-US / India atmosphere |
| de.biosunlocktool.com | de-DE |
| pl.biosunlocktool.com | pl-PL — Polish canonical-layout experiment |
| af.biosunlocktool.com | af-ZA |
