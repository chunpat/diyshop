import {handleApi,publicStoreApi} from '../lib/api';
import {verifyAccess} from './access';
import {authPage,passwordEndpoint,passwordIdentity,loginReturnTo} from './password-auth';
import {accountsEndpoint} from './accounts';
import storefront from '../app/storefront.html?raw';
type Env={DB:D1Database,ASSETS:Fetcher,ADMIN_EMAILS?:string,CF_ACCESS_TEAM?:string,CF_ACCESS_AUD?:string,AUTH_MODE?:string,AUTH_PEPPER?:string,SETUP_KEY?:string};
const html=storefront.replaceAll('Sign in with ChatGPT','Sign in securely');
const protectedError=(status:number,message:string)=>new Response(message,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);
 if(url.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname)){url.protocol='https:';return Response.redirect(url.href,308)}
 const passwordMode=env.AUTH_MODE==='password';
 if(passwordMode&&url.pathname==='/'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

 if(passwordMode&&url.pathname.startsWith('/api/auth/'))return passwordEndpoint(request,env);
 if(passwordMode&&(url.pathname==='/login'||url.pathname==='/setup'||url.pathname==='/activate')&&['GET','HEAD'].includes(request.method)){
  if(url.pathname==='/setup'&&(!env.SETUP_KEY||await env.DB.prepare("SELECT id FROM auth_owner WHERE id='owner'").first()))return Response.redirect(url.origin+'/login',302);
  if(url.pathname==='/login'&&await passwordIdentity(request,env))return Response.redirect(url.origin+loginReturnTo(url.searchParams.get('return_to')),302);
  return new Response(request.method==='HEAD'?null:authPage(url.pathname==='/setup'?'setup':url.pathname==='/activate'?'activate':'login',loginReturnTo(url.searchParams.get('return_to'))),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }
 // Identity comes from a verified Access token or a database-backed HttpOnly session.
 // Caller-supplied Sites identity headers are never trusted on this deployment.
 if(!passwordMode&&(!env.CF_ACCESS_TEAM||!env.CF_ACCESS_AUD))return protectedError(503,'Private deployment is waiting for authentication configuration.');
 const user=passwordMode?await passwordIdentity(request,env):await verifyAccess(request.headers.get('Cf-Access-Jwt-Assertion')||undefined,env.CF_ACCESS_TEAM!,env.CF_ACCESS_AUD!);
 if(!user&&passwordMode){const publicResponse=await publicStoreApi(request,env.DB);if(publicResponse)return publicResponse;}
 if(!user){if(url.pathname.startsWith('/api/'))return Response.json({error:'Sign in to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});return passwordMode?Response.redirect(url.origin+'/login?return_to='+encodeURIComponent(url.pathname==='/admin.html'?'/admin':url.pathname+url.search),302):protectedError(403,'Sign in through Cloudflare Access to continue.');}
 if(passwordMode&&/^\/api\/admin\/accounts(?:\/|$)/.test(url.pathname))return accountsEndpoint(request,env,user);
 if(url.pathname.startsWith('/api/'))return handleApi(request,env.DB,user,env.ADMIN_EMAILS||'');
 if(!['GET','HEAD'].includes(request.method))return protectedError(405,'Method not allowed.');
 if(url.pathname==='/signin-with-chatgpt'||url.pathname==='/login'){
  const value=url.searchParams.get('return_to')||'/';const safe=value.startsWith('/')&&!value.startsWith('//')?new URL(value,url.origin):new URL('/',url.origin);
  return Response.redirect(safe.origin===url.origin?safe.href:url.origin+'/',302);
 }
 if(url.pathname==='/signout-with-chatgpt')return passwordMode?Response.redirect(url.origin+'/login',302):Response.redirect(url.origin+'/cdn-cgi/access/logout',302);
 if(url.pathname==='/')return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(url.pathname==='/admin'||url.pathname==='/admin.html'){const response=await env.ASSETS.fetch(new Request(new URL('/admin.html',url),request));const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers})}
 return env.ASSETS.fetch(request);
}};
