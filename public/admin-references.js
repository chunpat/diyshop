/* Editorial reference collection; never used as a live product or preview configuration. */
let referenceCollection=null;
const referenceFilters={query:'',category:'',style:''};
async function renderReferences(){
 if(!can('products.read'))return;
 const host=$('#admin-content');
 host.innerHTML='<p role="status">正在加载素材案例…</p>';
 try{
  if(!referenceCollection){
   const response=await fetch('/reference-cases.json',{credentials:'same-origin'});
   if(!response.ok)throw new Error('素材案例加载失败，请重试');
   referenceCollection=await response.json();
  }
  if(tab!=='references')return;
  const cases=referenceCollection.cases;
  const options=(key)=>[...new Set(cases.map(c=>c[key]))].map(value=>`<option value="${esc(value)}" ${referenceFilters[key]===value?'selected':''}>${esc(value)}</option>`).join('');
  host.innerHTML=`<section class="reference-intro"><div><span class="eyebrow">DESIGN REFERENCE LIBRARY</span><h2>从案例，到自己的定制设计</h2><p>${cases.length} 个案例 · ${cases.reduce((n,c)=>n+c.images.length,0)} 张已收集参考图 · ${new Set(cases.map(c=>c.category)).size} 类商品</p></div><p class="reference-note">成品参考图用于看构图、款式和文字位置。制作实时模板时，另配空白底图、装饰层和文字区。</p></section><div class="reference-filters"><label>搜索案例<input id="reference-query" type="search" placeholder="例如：姓名、宠物、生日花…" value="${esc(referenceFilters.query)}"></label><label>商品类型<select id="reference-category"><option value="">全部商品</option>${options('category')}</select></label><label>设计风格<select id="reference-style"><option value="">全部风格</option>${options('style')}</select></label><button id="reference-reset" class="outline-button">重置筛选</button></div><p id="reference-count" class="admin-field-help" aria-live="polite"></p><div id="reference-grid" class="reference-grid"></div><p class="admin-field-help">收集日期：${esc(referenceCollection.researchedAt)} · 来源：Callie 英国站。定制要点来自商品标题与介绍，排版建议为本项目归纳。</p>`;
  $('#reference-query').oninput=e=>{referenceFilters.query=e.target.value;renderReferenceCards()};
  for(const key of ['category','style'])$('#reference-'+key).onchange=e=>{referenceFilters[key]=e.target.value;renderReferenceCards()};
  $('#reference-reset').onclick=()=>{Object.assign(referenceFilters,{query:'',category:'',style:''});$('#reference-query').value='';$('#reference-category').value='';$('#reference-style').value='';renderReferenceCards()};
  $('#reference-grid').onclick=e=>{const button=e.target.closest('[data-reference]');if(button)showReference(button.dataset.reference)};
  renderReferenceCards();
 }catch(error){if(tab==='references'){host.innerHTML='<p role="alert">素材案例暂时无法加载。</p><button class="outline-button" id="reference-retry">重新加载</button>';$('#reference-retry').onclick=renderReferences;toast(error.message)}}
}
function renderReferenceCards(){
 const q=referenceFilters.query.trim().toLowerCase();
 const cases=referenceCollection.cases.filter(c=>(!referenceFilters.category||c.category===referenceFilters.category)&&(!referenceFilters.style||c.style===referenceFilters.style)&&(!q||[c.title,c.category,c.style,c.observedFields,c.layoutSuggestion].join(' ').toLowerCase().includes(q)));
 $('#reference-count').textContent=`显示 ${cases.length} / ${referenceCollection.cases.length} 个案例`;
 $('#reference-grid').innerHTML=cases.length?cases.map(c=>`<article class="reference-card"><button class="reference-cover" data-reference="${esc(c.id)}" aria-label="查看${esc(c.title)}"><img loading="lazy" src="${esc(c.images[0].path)}" alt="${esc(c.title)}成品参考"><span>${c.images.length} 张参考图</span></button><div class="reference-card-body"><div class="reference-tags"><span>${esc(c.category)}</span><span>${esc(c.style)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.observedFields)}</p><button class="admin-action" data-reference="${esc(c.id)}">查看图片与排版建议 →</button></div></article>`).join(''):'<div class="empty-admin">没有匹配案例，试试其他关键词或重置筛选。</div>';
}
function showReference(id){
 if(!can('products.read'))return;
 const c=referenceCollection.cases.find(item=>item.id===id);if(!c)return;
 modal(`<article class="reference-detail"><span class="eyebrow">CALLIE · 成品参考</span><h2>${esc(c.title)}</h2><div class="reference-detail-layout"><div><img id="reference-main-image" class="reference-main-image" src="${esc(c.images[0].path)}" alt="${esc(c.title)}参考图 1"><div class="reference-thumbnails">${c.images.map((img,i)=>`<button data-reference-image="${i}" aria-label="查看参考图 ${i+1}" aria-pressed="${i===0}"><img src="${esc(img.path)}" alt="" loading="lazy"></button>`).join('')}</div><p id="reference-image-caption" class="admin-field-help">参考图 1 / ${c.images.length} · 已收集预览图</p><div class="reference-links"><a id="reference-download" href="${esc(c.images[0].path)}" download>下载这张参考图</a><a id="reference-original" href="${esc(c.images[0].source)}" target="_blank" rel="noopener noreferrer">查看原尺寸图 ↗</a></div></div><div class="reference-analysis"><div class="reference-tags"><span>${esc(c.category)}</span><span>${esc(c.style)}</span></div><h3>商品定制要点</h3><p>${esc(c.observedFields)}</p><h3>排版建议</h3><p>${esc(c.layoutSuggestion)}</p><h3>转成实时预览需要</h3><ol><li>准备该商品的空白底图。</li><li>拆分装饰、照片与文字区域。</li><li>按商品轮廓配置位置与裁切。</li></ol><p class="reference-note">本案例尚未制作实时模板；这些图已包含示例设计，不能直接当作空白底图。</p><a class="outline-button reference-source" href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">查看 Callie 原商品 ↗</a><p class="admin-field-help">来源图库共 ${c.sourceImageCount} 张，本库收集前 ${c.images.length} 张预览并保留全部原图链接。</p><details><summary>全部原图链接（${c.sourceImages.length}）</summary><div class="reference-source-list">${c.sourceImages.map((url,i)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">原图 ${i+1} ↗</a>`).join('')}</div></details></div></div></article>`);
 const dialog=$('#admin-modal');dialog.classList.add('reference-dialog');dialog.addEventListener('close',()=>dialog.classList.remove('reference-dialog'),{once:true});
 $('.reference-thumbnails').onclick=e=>{
  const button=e.target.closest('[data-reference-image]');if(!button)return;
  const index=Number(button.dataset.referenceImage),img=c.images[index];
  $('#reference-main-image').src=img.path;$('#reference-main-image').alt=`${c.title}参考图 ${index+1}`;
  $('#reference-download').href=img.path;$('#reference-original').href=img.source;
  $('#reference-image-caption').textContent=`参考图 ${index+1} / ${c.images.length} · 已收集预览图`;
  $$('[data-reference-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 };
}
