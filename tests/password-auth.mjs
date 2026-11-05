import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../.cloudflare-dist/index.js';
const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
const db={prepare(sql){return {params:[],bind(...params){this.params=params;return this},async first(){return sqlite.prepare(sql).get(...this.params)||null},async all(){return {results:sqlite.prepare(sql).all(...this.params)}},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...this.params).changes)}}}}},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
const env={DB:db,ASSETS:{fetch:async()=>new Response('asset')},AUTH_MODE:'password',AUTH_PEPPER:'unit-test-pepper-'+crypto.randomUUID(),SETUP_KEY:crypto.randomUUID(),ADMIN_EMAILS:'owner@example.com'};
async function call(path,method='GET',body,cookie='',extra={}){const r=await worker.fetch(new Request('https://store.test'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},...(method==='GET'?{}:{body:JSON.stringify(body??{})})}),env);const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data={html:raw}}return {status:r.status,cookie:r.headers.get('Set-Cookie')?.split(';')[0],location:r.headers.get('Location'),cacheControl:r.headers.get('Cache-Control'),...data}}
assert.equal((await call('/')).status,200);assert((await call('/')).html.includes('id="storefront"'));assert.equal((await call('/admin')).location,'https://store.test/login?return_to=%2Fadmin');assert.equal((await call('/admin')).status,302);assert.equal((await call('/login')).status,200);assert.equal((await call('/setup')).status,200);assert.equal((await call('/api/me','GET',null,'',{'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'owner@example.com'})).status,401);
const password='Unit-test-only-strong-password-471';
assert.equal((await call('/api/auth/setup','POST',{key:'wrong',password})).status,403);const setup=await call('/api/auth/setup','POST',{key:env.SETUP_KEY,password});assert.equal(setup.status,201);assert(setup.cookie);assert.equal((await call('/setup')).status,302);assert.equal((await call('/login','GET',null,setup.cookie)).location,'https://store.test/');assert.equal((await call('/login?return_to=%2Fadmin','GET',null,setup.cookie)).location,'https://store.test/admin');assert.equal((await call('/api/auth/setup','POST',{key:env.SETUP_KEY,password})).status,409);
assert.equal((await call('/admin','GET',null,setup.cookie)).cacheControl,'no-store');assert.equal((await call('/admin.html','GET',null,setup.cookie)).cacheControl,'no-store');
const stored=sqlite.prepare('SELECT * FROM auth_owner').get();assert.notEqual(stored.password_hash,password);assert.equal(stored.iterations,100000);assert.equal(stored.salt.length,32);assert.equal((await call('/api/me','GET',null,setup.cookie)).isAdmin,true);
assert.equal((await call('/api/auth/login','POST',{email:env.ADMIN_EMAILS,password},'',{Origin:'https://evil.test'})).status,403);assert.equal((await call('/api/auth/login','POST',{email:env.ADMIN_EMAILS,password:'incorrect-password-123'})).status,401);const login=await call('/api/auth/login','POST',{email:env.ADMIN_EMAILS,password});assert.equal(login.status,200);assert(login.cookie);assert.equal((await call('/api/admin/seed','POST',{},login.cookie)).status,200);assert.equal((await call('/api/products','GET',null,login.cookie)).products.length,53);
// Browsing is public; personal data and every mutation remain protected.
for(const route of ['/api/state','/api/orders','/api/admin/dashboard','/api/admin/accounts'])assert.equal((await call(route)).status,401);
for(const route of ['/api/state','/api/orders','/api/admin/media'])assert.equal((await call(route,'POST',{})).status,401);
assert.equal((await call('/api/admin/products/0','PATCH',{})).status,401);
assert.equal((await call('/api/products')).products.length,53);
sqlite.exec('UPDATE products SET active=0 WHERE id=1');
const publicProducts=(await call('/api/products')).products;assert.equal(publicProducts.length,52);assert(!publicProducts.some(p=>p.id===1));assert(!('updated_at' in publicProducts[0]));
sqlite.exec('UPDATE products SET active=1 WHERE id=1');
const imageId=crypto.randomUUID(),imagePath='/api/media/'+imageId;
sqlite.prepare('INSERT INTO media_assets (id,mime,data,byte_size,created_by,created_at) VALUES (?,?,?,?,?,?)').run(imageId,'image/png',btoa('test-image'),16,'owner',new Date().toISOString());
assert.equal((await call(imagePath)).status,404);
sqlite.prepare('UPDATE products SET gallery=? WHERE id=0').run(JSON.stringify([imagePath]));
const image=await worker.fetch(new Request('https://store.test'+imagePath),env);assert.equal(image.status,200);assert.equal(await image.text(),'test-image');
const head=await worker.fetch(new Request('https://store.test'+imagePath,{method:'HEAD'}),env);assert.equal(head.status,200);assert.equal(await head.text(),'');
sqlite.exec('UPDATE products SET active=0 WHERE id=0');assert.equal((await call(imagePath)).status,404);
sqlite.prepare('UPDATE products SET active=1,gallery=?,customization_json=? WHERE id=0').run('[]',JSON.stringify({nameLimit:8,fields:[],preview:{type:'corduroy',baseImage:imagePath}}));assert.equal((await call(imagePath)).status,200);
sqlite.prepare('UPDATE products SET image=?,customization_json=NULL WHERE id=0').run(imagePath);assert.equal((await call(imagePath)).status,200);
sqlite.prepare('UPDATE products SET image=? WHERE id=0').run('assets/product0.png');assert.equal((await call(imagePath)).status,404);
for(const target of ['https://evil.test','//evil.test','/\\evil.test','/api/admin/accounts','/<script>alert(1)</script>']){
 const route='/login?return_to='+encodeURIComponent(target);
 assert.equal((await call(route,'GET',null,setup.cookie)).location,'https://store.test/');
 assert((await call(route)).html.includes('location.replace("/")'));
}
const returnGift='/#gift/52';assert.equal((await call('/login?return_to='+encodeURIComponent(returnGift),'GET',null,setup.cookie)).location,'https://store.test/'+returnGift.slice(1));
assert((await call('/login?return_to=%2Fadmin')).html.includes('location.replace("/admin")'));
assert((await call('/login?return_to=%2F%23gift%2F52')).html.includes('location.replace("/#gift/52")'));

assert.equal((await call('/api/auth/logout','POST',{},login.cookie)).status,200);assert.equal((await call('/api/me','GET',null,login.cookie)).status,401);assert.equal((await call('/api/me','GET',null,setup.cookie)).status,200);sqlite.exec('UPDATE auth_sessions SET expires_at=0');assert.equal((await call('/api/me','GET',null,setup.cookie)).status,401);
for(let i=0;i<11;i++)await call('/api/auth/login','POST',{email:env.ADMIN_EMAILS,password:'incorrect-password-123'},'',{'CF-Connecting-IP':'rate-limit-test'});assert.equal((await call('/api/auth/login','POST',{email:env.ADMIN_EMAILS,password},'',{'CF-Connecting-IP':'rate-limit-test'})).status,429);
console.log('PASS: public storefront/catalog/published media, protected personal/admin data, safe login return targets, private routes, forged headers, one-time setup, salted and peppered password hashing, login, cookies, session isolation, expiry, logout, rate limits, CSRF, authenticated catalog.');sqlite.close();
