import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'callie-auth-'));
await build({entryPoints:['cloudflare/access.ts'],bundle:true,format:'esm',platform:'node',outfile:join(dir,'access.mjs')});
const {verifyAccess}=await import(join(dir,'access.mjs'));
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'key-1'},team='https://callie-test.cloudflareaccess.com',aud='test-app',time=Math.floor(Date.now()/1000);
const b64=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
async function sign(claims,header={alg:'RS256',kid:'key-1'}){const data=b64(header)+'.'+b64(claims),sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(data));return data+'.'+Buffer.from(sig).toString('base64url')}
const claims={sub:'owner',email:'owner@example.com',iss:team,aud:[aud],iat:time,exp:time+3600};const getKeys=async()=>[jwk];const token=await sign(claims);
assert.equal((await verifyAccess(token,team,aud,getKeys)).email,claims.email);
for(const change of [{iss:'https://evil.example'},{aud:['other-app']},{exp:time-1},{nbf:time+3600},{iat:time+3600},{email:null},{sub:null}])assert.equal(await verifyAccess(await sign({...claims,...change}),team,aud,getKeys),null);
assert.equal(await verifyAccess(token,team,'',getKeys),null);assert.equal(await verifyAccess(token,'https://evil.example',aud,getKeys),null);assert.equal(await verifyAccess(await sign(claims,{alg:'none',kid:'key-1'}),team,aud,getKeys),null);assert.equal(await verifyAccess(token+'tampered',team,aud,getKeys),null);assert.equal(await verifyAccess(undefined,team,aud,getKeys),null);
console.log('PASS: Cloudflare Access RS256 signatures, issuer, audience, expiry, future tokens, missing identity, untrusted key host and tampering checks.');rmSync(dir,{recursive:true,force:true});
