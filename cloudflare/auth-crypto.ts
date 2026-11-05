export type AuthEnv={DB:D1Database,ADMIN_EMAILS?:string,AUTH_PEPPER?:string,SETUP_KEY?:string};
export const COOKIE='__Host-callie_session',ITERATIONS=100000,LIFETIME=7*86400;
export const encoder=new TextEncoder();
export const hex=(data:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(data)).map(x=>x.toString(16).padStart(2,'0')).join('');
const bytes=(value:string)=>new Uint8Array((value.match(/../g)||[]).map(x=>parseInt(x,16)));
export const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
export const authJson=(data:unknown,status=200,sessionCookie?:string)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(sessionCookie?{'Set-Cookie':sessionCookie}:{})}});
export const equal=(a:string,b:string)=>{if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0};
export async function passwordHash(password:string,salt:string,pepper:string,iterations=ITERATIONS){const hmac=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);const secret=await crypto.subtle.sign('HMAC',hmac,encoder.encode(password));const key=await crypto.subtle.importKey('raw',secret,'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations},key,256))}
export function cookie(value:string,maxAge=LIFETIME){return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`}
export async function passwordSession(db:D1Database,userId='owner'){const token=random();await db.prepare('INSERT INTO auth_sessions (hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),userId,Math.floor(Date.now()/1000)+LIFETIME).run();return cookie(token)}
export async function authBody(request:Request,max=12000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});let body;try{body=JSON.parse(raw)}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400})}if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(new Error('Invalid request.'),{status:400});return body}
