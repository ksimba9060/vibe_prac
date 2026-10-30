import { copyFile, mkdir } from 'node:fs/promises';
await mkdir(new URL('../public/supabase/', import.meta.url), { recursive: true });
await copyFile(new URL('../supabase/setup.sql', import.meta.url), new URL('../public/supabase/setup.sql', import.meta.url));
