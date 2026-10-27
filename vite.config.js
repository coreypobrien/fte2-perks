import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./app',import.meta.url));
export default defineConfig({
  root,
  base:'./',
  publicDir:false,
  server:{host:'127.0.0.1',port:4173,strictPort:true},
  preview:{host:'127.0.0.1',port:4173,strictPort:true},
  worker:{format:'es'},
  build:{outDir:fileURLToPath(new URL('./dist',import.meta.url)),emptyOutDir:true,target:'es2022',manifest:true},
});
