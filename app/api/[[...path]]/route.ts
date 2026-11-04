import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {handleApi} from '../../../lib/api';
async function handle(request:Request){if(!env.DB)return Response.json({error:'Database is unavailable.'},{status:503});return handleApi(request,env.DB,await getChatGPTUser(),(env as any).ADMIN_EMAILS||'')}
export const GET=handle;export const POST=handle;export const PUT=handle;export const PATCH=handle;export const DELETE=handle;
