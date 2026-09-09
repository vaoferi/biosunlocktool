# BIOS Unlock Tool — Multilingual Landing Pages

## Structure
```
/
├── locales/
│   ├── en-US/      → biosunlocktool.com
│   ├── en-IN/      → in.biosunlocktool.com
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
| biosunlocktool.com | en-US |
| in.biosunlocktool.com | en-IN |
| de.biosunlocktool.com | de-DE |
| pl.biosunlocktool.com | pl-PL |
| af.biosunlocktool.com | af-ZA |
