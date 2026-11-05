import type {Identity} from '../lib/api';
type Jwk=JsonWebKey&{kid?:string};
let cached:{url:string,expires:number,keys:Jwk[]}|null=null;
const decode=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const parse=(value:string)=>JSON.parse(new TextDecoder().decode(decode(value)));
export async function verifyAccess(token:string|undefined,team:string,audience:string,getKeys?:()=>Promise<Jwk[]>):Promise<Identity|null>{
 try{
  if(!token||token.length>20000||!audience||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team))return null;
  const parts=token.split('.');if(parts.length!==3)return null;
  const header=parse(parts[0]),claims=parse(parts[1]),time=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==team||typeof claims.exp!=='number'||claims.exp<=time||(claims.nbf&&claims.nbf>time+30)||typeof claims.iat!=='number'||claims.iat>time+30)return null;
  const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];if(!audiences.includes(audience)||typeof claims.sub!=='string'||!claims.sub||typeof claims.email!=='string'||!claims.email)return null;
  let keys:Jwk[];
  if(getKeys)keys=await getKeys();else{
   const url=team+'/cdn-cgi/access/certs';
   if(!cached||cached.url!==url||cached.expires<time||!cached.keys.some(k=>k.kid===header.kid)){
    const response=await fetch(url,{signal:AbortSignal.timeout(5000)});if(!response.ok)return null;
    const data=await response.json() as {keys:Jwk[]};if(!Array.isArray(data.keys))return null;cached={url,keys:data.keys,expires:time+300};
   }keys=cached.keys;
  }
  const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));if(!valid)return null;
  return {userId:'cf:'+claims.sub,email:claims.email,displayName:typeof claims.name==='string'?claims.name:claims.email};
 }catch{return null}
}
