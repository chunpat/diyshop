export const PERMISSIONS=[
 {key:'products.read',label:'查看商品',group:'商品管理'},
 {key:'products.write',label:'编辑商品、价格、库存及上下架',group:'商品管理'},
 {key:'orders.read',label:'查看订单和收货信息',group:'订单管理'},
 {key:'orders.write',label:'处理订单、确认线下收款及发货',group:'订单管理'},
 {key:'support.read',label:'查看客服留言',group:'客服管理'},
 {key:'support.write',label:'处理客服留言',group:'客服管理'},
 {key:'subscribers.read',label:'查看订阅邮箱名单',group:'订阅管理'},
 {key:'accounts.manage',label:'新增账号、调整权限及停用账号',group:'账户管理'},
] as const;
export type Permission=typeof PERMISSIONS[number]['key'];
export const ALL_PERMISSIONS=PERMISSIONS.map(p=>p.key);
export const ROLES={
 admin:{label:'管理员',permissions:ALL_PERMISSIONS},
 operator:{label:'运营',permissions:ALL_PERMISSIONS.filter(p=>p!=='accounts.manage'&&p!=='subscribers.read')},
 viewer:{label:'只读',permissions:['products.read','orders.read'] as Permission[]},
};
export type AccountRole=keyof typeof ROLES;
export function roleCeiling(role:AccountRole):Permission[]{return role==='viewer'?ALL_PERMISSIONS.filter(p=>p.endsWith('.read')):role==='operator'?ALL_PERMISSIONS.filter(p=>p!=='accounts.manage'):ALL_PERMISSIONS}
export function storedPermissions(value:string,role:string):Permission[]{try{if(!Object.hasOwn(ROLES,role))return [];const list=JSON.parse(value),allowed=roleCeiling(role as AccountRole);return Array.isArray(list)?ALL_PERMISSIONS.filter(p=>list.includes(p)&&allowed.includes(p)):[]}catch{return []}}
export function effectivePermissions(user:{permissions?:string[],email:string},adminEmails:string):Permission[]{return user.permissions!==undefined?ALL_PERMISSIONS.filter(p=>user.permissions!.includes(p)):adminEmails.split(',').some(e=>e.trim().toLowerCase()===user.email.toLowerCase())?[...ALL_PERMISSIONS]:[]}
