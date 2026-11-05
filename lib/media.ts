const MAX=768*1024,QUOTA=100*1024*1024;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function mediaApi(req:Request,db:D1Database,mayWrite:boolean,userId:string):Promise<Response|null>{
 const path=new URL(req.url).pathname,match=path.match(/^\/api\/media\/([a-f0-9-]{36})$/);
 if(match&&['GET','HEAD'].includes(req.method)){const row=await db.prepare('SELECT mime,data FROM media_assets WHERE id=?').bind(match[1]).first<any>();if(!row)return reply({error:'Image not found.'},404);return new Response(req.method==='HEAD'?null:Uint8Array.from(atob(row.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':row.mime,'Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}})}
 if(path!=='/api/admin/media'||req.method!=='POST')return null;
 if(!mayWrite)return reply({error:'没有商品编辑权限'},403);
 if(Number(req.headers.get('content-length'))>MAX)return reply({error:'图片压缩后不能超过 768 KB'},413);
 const reader=req.body?.getReader();if(!reader)return reply({error:'请选择图片'},400);const chunks:Uint8Array[]=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX){await reader.cancel();return reply({error:'图片压缩后不能超过 768 KB'},413)}chunks.push(value)}const bytes=new Uint8Array(length);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length}
 const ascii=(from:number,to:number)=>String.fromCharCode(...bytes.slice(from,to));const mime=bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'?'image/webp':null;
 if(length<24||!mime||req.headers.get('content-type')?.split(';')[0]!==mime)return reply({error:'仅支持有效的 JPG、PNG、WebP 图片'},415);
 const id=crypto.randomUUID();let binary='';for(let i=0;i<length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));const data=btoa(binary);
 const result=await db.prepare('INSERT INTO media_assets (id,mime,data,byte_size,created_by,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COALESCE(SUM(byte_size),0) FROM media_assets)+?<=?').bind(id,mime,data,data.length,userId,new Date().toISOString(),data.length,QUOTA).run();if(!result.meta.changes)return reply({error:'图片库已达到 100 MB 上限，请联系店主扩容'},413);
 return reply({url:'/api/media/'+id,bytes:length},201);
}
