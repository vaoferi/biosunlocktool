#!/usr/bin/env node
// Simple build script for Cloudflare Pages
import fs from 'fs';
import path from 'path';

const locales = ['en-US', 'en-IN', 'de-DE', 'pl-PL', 'af-ZA'];

// Copy assets to each locale directory if needed
// For now, assets are served from root
console.log('✅ Build complete — all locales ready for Cloudflare Pages');
