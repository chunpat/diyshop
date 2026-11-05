import {build} from 'esbuild';
import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'.cloudflare-dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(path.join(root,'public'),path.join(out,'public'),{recursive:true});
// esbuild's raw HTML import is handled without the framework's server bundle.
await build({entryPoints:[path.join(root,'cloudflare/worker.ts')],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:path.join(out,'index.js'),plugins:[{name:'raw-html',setup(b){b.onResolve({filter:/\.html\?raw$/},a=>({path:path.resolve(a.resolveDir,a.path.slice(0,-4)),namespace:'html'}));b.onLoad({filter:/.*/,namespace:'html'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}))}}]});
for(const file of ['backend.js','admin.js']){const p=path.join(out,'public',file),text=await readFile(p,'utf8');let updated=text.replaceAll('Sign in with ChatGPT','Sign in securely');if(file==='backend.js'){updated=updated.replace('<button type="button" class="outline-button" id="profile-orders">My orders</button>','<button type="button" class="outline-button" id="profile-orders">My orders</button><button type="button" class="outline-button" id="profile-logout">Sign out</button>');updated=updated.replace("$('#profile-orders').onclick=showOrders;","$('#profile-orders').onclick=showOrders;$('#profile-logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST',body:'{}'});location.assign('/login')}catch(error){toast(error.message)}};")}await writeFile(p,updated)}
console.log('Standalone Cloudflare Worker and static assets built.');
