(function(){
'use strict';

/* ====== DADOS DA PIZZARIA (troque aqui) ====== */
const CONFIG = {
  nome: 'Brasô',
  whatsapp: '5535999999999',            // 55 + DDD + número, só dígitos
  horario: '',                          // ex.: 'Todos os dias, 18h às 23h30' (vazio = não mostra)
  entrega: 'Taxa confirmada pelo WhatsApp'
};
const SIZES = [
  {id:'media',  nome:'Média',  sig:'M'},
  {id:'grande', nome:'Grande', sig:'G'}
];
/* preços na ordem das tamanhos: média, grande */
const CATS = [
  {id:'tradicional', tab:'Tradicionais', k:'Pizzas',        big:'Tradicionais', um:'Pizza tradicional', precos:[44.99,54.99]},
  {id:'especial',    tab:'Especiais',    k:'Pizzas',        big:'Especiais',    um:'Pizza especial',    precos:[49.99,59.99]},
  {id:'casa',        tab:'Da casa',      k:'Pizza da casa', big:'Brasô',        um:'Pizza da casa',     precos:[59.99,69.99]},
  {id:'doce',        tab:'Doces',        k:'Pizzas',        big:'Doces',        um:'Pizza doce',        precos:[39.99,49.99]}
];
const PB = 'Molho de tomate artesanal, ';
const PIZZAS = [
  {n:1,  id:'mussarela',  cat:'tradicional', nome:'Mussarela',  ing:PB+'mussarela, tomate, azeitona e orégano.'},
  {n:2,  id:'marguerita', cat:'tradicional', nome:'Marguerita', ing:PB+'mussarela, tomate, manjericão, orégano e azeite.'},
  {n:3,  id:'calabresa',  cat:'tradicional', nome:'Calabresa',  ing:PB+'mussarela, calabresa, cebola, azeitona e orégano.'},
  {n:4,  id:'napolitana', cat:'tradicional', nome:'Napolitana', ing:PB+'presunto, mussarela, tomate, azeitona e orégano.'},
  {n:5,  id:'frango',     cat:'tradicional', nome:'Frango',     ing:PB+'frango, milho verde, mussarela, tomate, cebola, azeitona e orégano.'},
  {n:6,  id:'palmito',    cat:'tradicional', nome:'Palmito',    ing:PB+'palmito, mussarela, tomate, azeitona e orégano.'},
  {n:7,  id:'bacon',      cat:'tradicional', nome:'Bacon',      ing:PB+'bacon, mussarela, presunto, milho verde, tomate, cebola, azeitona e orégano.'},
  {n:8,  id:'quatro',     cat:'especial',    nome:'Quatro Queijos', ing:PB+'mussarela, provolone, parmesão, catupiry ou cheddar, tomate, orégano e azeite.',
         escolha:{titulo:'Catupiry ou cheddar?', opcoes:['Catupiry','Cheddar']}},
  {n:9,  id:'portuguesa', cat:'especial',    nome:'Portuguesa', ing:PB+'presunto, mussarela, milho verde, ovo cozido, cebola, ervilha, azeitona e orégano.'},
  {n:10, id:'frango-catupiry', cat:'especial', nome:'Frango com Catupiry', ing:PB+'frango, milho verde, mussarela, catupiry, tomate, cebola, azeitona e orégano.'},
  {n:11, id:'frango-cheddar',  cat:'especial', nome:'Frango com Cheddar',  ing:PB+'frango, milho verde, mussarela, cheddar, tomate, cebola, azeitona e orégano.'},
  {n:12, id:'frango-palmito',  cat:'especial', nome:'Frango com Palmito',  ing:PB+'frango, palmito, mussarela, catupiry, tomate, cebola, azeitona e orégano.'},
  {n:13, id:'frango-bacon',    cat:'especial', nome:'Frango com Bacon',    ing:PB+'frango, bacon, mussarela, catupiry, tomate, cebola, azeitona e orégano.'},
  {n:14, id:'braso',      cat:'casa',        nome:'Brasô',      ing:PB+'frango, bacon, calabresa, presunto, palmito, mussarela, catupiry, milho verde, tomate, cebola, azeitona, orégano e azeite.'},
  {n:15, id:'brigadeiro', cat:'doce',        nome:'Brigadeiro', ing:'Brigadeiro e granulado.'},
  {n:16, id:'prestigio',  cat:'doce',        nome:'Prestígio',  ing:'Brigadeiro e coco ralado.'},
  {n:17, id:'confete',    cat:'doce',        nome:'Confete',    ing:'Chocolate ao leite e confetes.'},
  {n:18, id:'ninho',      cat:'doce',        nome:'Ninho',      ing:'Creme de Ninho e granulado.'}
];
/* ============================================= */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const plain = s => s.replace(/ /g,' ');
const byId = Object.fromEntries(PIZZAS.map(p => [p.id,p]));
const sizeById = Object.fromEntries(SIZES.map(s => [s.id,s]));
const catById = Object.fromEntries(CATS.map(c => [c.id,c]));

const price = (pid,sid) => catById[byId[pid].cat].precos[SIZES.findIndex(s => s.id === sid)];
const lineTotal = it => price(it.pizza,it.size) * it.qty;
const waUrl = msg => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);

/* estado */
const KEY = 'braso-pedido-v1';
let cart = [];
const cust = {tipo:'entrega', nome:'', end:'', pag:'Pix', troco:''};
let sel = null, filter = 'todas', openSheet = null, lastFocus = null, toastTimer = null;

const validItem = it => {
  if (!it || !byId[it.pizza] || !sizeById[it.size]) return false;
  if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 99) return false;
  const e = byId[it.pizza].escolha;
  return e ? e.opcoes.includes(it.escolha) : !it.escolha;
};
function save(){ try{ localStorage.setItem(KEY, JSON.stringify({cart,cust})); }catch(e){} }
function load(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && Array.isArray(d.cart)) cart = d.cart.filter(validItem).map(it => ({pizza:it.pizza, size:it.size, escolha:it.escolha||'', qty:it.qty, obs:String(it.obs||'').slice(0,140)}));
    if (d && d.cust){
      ['tipo','nome','end','pag','troco'].forEach(k => { if (typeof d.cust[k] === 'string') cust[k] = d.cust[k].slice(0,300); });
      if (cust.tipo !== 'entrega' && cust.tipo !== 'retirada') cust.tipo = 'entrega';
    }
  }catch(e){}
}

/* capa */
function renderHero(){
  const d = CONFIG.whatsapp.replace(/\D/g,'');
  const fone = (d.length === 13 && d.startsWith('55')) ? '(' + d.slice(2,4) + ') ' + d.slice(4,9) + '-' + d.slice(9) : d;
  $('#info').innerHTML = 'WhatsApp <b>' + esc(fone) + '</b>' + (CONFIG.horario ? '<br>' + esc(CONFIG.horario) : '');
  $('#ctDeliv').textContent = CONFIG.entrega;
}

/* abas e cardápio */
function renderTabs(){
  $('#tabs').innerHTML = [{id:'todas',tab:'Todas'}].concat(CATS).map(c =>
    '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="' + (filter === c.id) + '">' + c.tab + '</button>').join('');
}
function row(p){
  return '<button class="item' + (p.cat === 'casa' ? ' feature' : '') + '" type="button" data-id="' + p.id + '">' +
    '<span class="num">' + p.n + '.</span>' +
    '<span class="item-main"><span class="item-name">' + esc(p.nome) + '</span><span class="item-ing">' + esc(p.ing) + '</span></span>' +
    '<span class="plus" aria-hidden="true">+</span></button>';
}
function renderMenu(){
  $('#menu').innerHTML = CATS.filter(c => filter === 'todas' || filter === c.id).map(c => {
    const list = PIZZAS.filter(p => p.cat === c.id);
    const box = '<div class="pricebox">' + SIZES.map((s,i) =>
      '<div><span>' + s.nome + ' (' + s.sig + ')</span><strong class="price-num"><small>R$</small>' +
      c.precos[i].toLocaleString('pt-BR',{minimumFractionDigits:2}) + '</strong></div>').join('') + '</div>';
    return '<section class="cat" aria-labelledby="cat-' + c.id + '"><div class="cat-head"><h2 id="cat-' + c.id + '"><span class="k">' + c.k +
      '</span><span class="big">' + c.big + '</span></h2>' + box + '</div><div class="rows' + (list.length === 1 ? ' one' : '') + '">' +
      list.map(row).join('') + '</div></section>';
  }).join('');
}

/* folhas (abrir, fechar, foco) */
function showSheet(el){
  lastFocus = document.activeElement;
  $('#scrim').hidden = false; el.hidden = false; openSheet = el;
  document.body.classList.add('locked');
  const body = el.querySelector('.sheet-body'); if (body) body.scrollTop = 0;
  el.querySelector('[data-close]').focus();
}
function closeSheets(){
  $('#scrim').hidden = true; $('#pizzaSheet').hidden = true; $('#cartSheet').hidden = true;
  openSheet = null; document.body.classList.remove('locked');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

/* escolha da pizza */
function openPizza(id){
  const p = byId[id];
  sel = {pizza:id, size:'media', escolha:p.escolha ? p.escolha.opcoes[0] : '', qty:1, obs:''};
  $('#pzCat').textContent = catById[p.cat].um + ' · nº ' + p.n;
  $('#pzTitle').textContent = p.nome;
  $('#pzIng').textContent = p.ing;
  $('#pzSizes').innerHTML = SIZES.map(s =>
    '<label class="size"><input type="radio" name="pzsize" value="' + s.id + '"' + (s.id === sel.size ? ' checked' : '') + '>' +
    '<span class="box"><small>' + s.nome + ' (' + s.sig + ')</small><span class="size-price">' + brl(price(id,s.id)) + '</span></span></label>').join('');
  const wrap = $('#pzChoiceWrap');
  wrap.hidden = !p.escolha;
  if (p.escolha){
    $('#pzChoiceLbl').textContent = p.escolha.titulo;
    $('#pzChoice').innerHTML = p.escolha.opcoes.map((o,i) =>
      '<label><input type="radio" name="pzchoice" value="' + esc(o) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>').join('');
  }
  $('#pzObs').value = '';
  updatePizza();
  showSheet($('#pizzaSheet'));
}
function directMessage(it){
  return plain('Olá, ' + CONFIG.nome + '! Quero fazer um pedido:\n\n' + lineText(it) +
    '\n\n*Total: ' + brl(lineTotal(it)) + '*\n\nMeu nome:\nEndereço (ou retirada no local):');
}
function updatePizza(){
  if (!sel) return;
  $('#pzQty').textContent = sel.qty;
  $('#pzTotal').textContent = brl(lineTotal(sel));
  $('#pzWa').href = waUrl(directMessage(sel));
}

/* texto do pedido */
function lineText(it){
  const p = byId[it.pizza], s = sizeById[it.size];
  let t = '*' + it.qty + 'x Pizza ' + s.nome + '* - ' + p.nome + ' (nº ' + p.n + ')';
  if (it.escolha) t += '\n   Com ' + it.escolha.toLowerCase();
  if (it.obs) t += '\n   Obs: ' + it.obs;
  t += '\n   ' + brl(lineTotal(it));
  return plain(t);
}
function cartTotal(){ return cart.reduce((a,it) => a + lineTotal(it), 0); }
function cartMessage(){
  const ent = cust.tipo === 'entrega';
  let m = '*Pedido - ' + CONFIG.nome + '*\n\n' + cart.map(lineText).join('\n\n') +
    '\n\n*Total dos itens: ' + brl(cartTotal()) + '*' + (ent ? ' (sem a entrega)' : '') +
    '\n\nTipo: ' + (ent ? 'Entrega' : 'Retirada no local') +
    '\nNome: ' + cust.nome.trim();
  if (ent) m += '\nEndereço: ' + cust.end.trim();
  m += '\nPagamento: ' + cust.pag;
  if (cust.pag === 'Dinheiro' && cust.troco.trim()) m += '\nTroco para: R$ ' + cust.troco.trim();
  return plain(m);
}

/* comanda */
function updateBar(){
  const n = cart.reduce((a,it) => a + it.qty, 0);
  $('#bar').hidden = n === 0;
  document.body.classList.toggle('has-cart', n > 0);
  $('#barCount').textContent = n + (n === 1 ? ' pizza no pedido' : ' pizzas no pedido');
  $('#barTotal').textContent = brl(cartTotal());
}
function renderCart(){
  $('#ctLines').innerHTML = cart.map((it,i) => {
    const p = byId[it.pizza];
    const sub = sizeById[it.size].nome + (it.escolha ? ' · com ' + it.escolha.toLowerCase() : '');
    return '<li class="line"><div class="line-main"><p class="line-title">' + esc(p.nome) + '</p>' +
      '<p class="line-sub">' + esc(sub) + '</p>' + (it.obs ? '<p class="line-obs">Obs: ' + esc(it.obs) + '</p>' : '') + '</div>' +
      '<div class="line-side"><span class="line-price">' + brl(lineTotal(it)) + '</span>' +
      '<div class="stepper sm"><button type="button" data-act="dec" data-i="' + i + '" aria-label="Diminuir">−</button><output>' + it.qty +
      '</output><button type="button" data-act="inc" data-i="' + i + '" aria-label="Aumentar">+</button></div>' +
      '<button class="rm" type="button" data-act="del" data-i="' + i + '">Remover</button></div></li>';
  }).join('');
  $('#ctTotal').textContent = brl(cartTotal());
  updateCartLink();
}
function syncForm(){
  document.querySelectorAll('input[name="ctTipo"]').forEach(r => { r.checked = r.value === cust.tipo; });
  $('#ctNome').value = cust.nome; $('#ctAddr').value = cust.end; $('#ctPay').value = cust.pag;
  if ($('#ctPay').value !== cust.pag) cust.pag = $('#ctPay').value;
  $('#ctChange').value = cust.troco;
  $('#ctAddrWrap').hidden = cust.tipo !== 'entrega';
  $('#ctChangeWrap').hidden = cust.pag !== 'Dinheiro';
}
function updateCartLink(){
  $('#ctWa').href = cart.length ? waUrl(cartMessage()) : '#';
}
function openCart(){
  if (!cart.length) return;
  const d = new Date();
  $('#ctDate').textContent = 'Comanda · ' + d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  $('#ctErr').hidden = true;
  syncForm(); renderCart();
  showSheet($('#cartSheet'));
}
function cartChanged(){
  save(); updateBar();
  if (!cart.length){ closeSheets(); return; }
  renderCart();
}

/* eventos */
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  filter = b.dataset.cat; renderTabs(); renderMenu();
});
$('#menu').addEventListener('click', e => {
  const b = e.target.closest('.item'); if (b) openPizza(b.dataset.id);
});
$('#bar').addEventListener('click', openCart);
$('#scrim').addEventListener('click', closeSheets);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheets));

$('#pzSizes').addEventListener('change', e => { if (e.target.name === 'pzsize'){ sel.size = e.target.value; updatePizza(); } });
$('#pzChoice').addEventListener('change', e => { if (e.target.name === 'pzchoice'){ sel.escolha = e.target.value; updatePizza(); } });
$('#pzMinus').addEventListener('click', () => { if (sel.qty > 1){ sel.qty--; updatePizza(); } });
$('#pzPlus').addEventListener('click', () => { if (sel.qty < 20){ sel.qty++; updatePizza(); } });
$('#pzObs').addEventListener('input', e => { sel.obs = e.target.value.trim(); updatePizza(); });
$('#pzAdd').addEventListener('click', () => {
  cart.push({...sel});
  save(); updateBar(); closeSheets();
  toast('Pizza adicionada ao pedido');
});

$('#ctLines').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const i = +b.dataset.i, it = cart[i]; if (!it) return;
  if (b.dataset.act === 'inc' && it.qty < 20) it.qty++;
  else if (b.dataset.act === 'dec') it.qty--;
  else if (b.dataset.act === 'del') it.qty = 0;
  if (it.qty <= 0) cart.splice(i,1);
  cartChanged();
});
$('#ctClear').addEventListener('click', () => { cart = []; cartChanged(); });
document.querySelectorAll('input[name="ctTipo"]').forEach(r => r.addEventListener('change', e => {
  cust.tipo = e.target.value; $('#ctAddrWrap').hidden = cust.tipo !== 'entrega'; save(); updateCartLink();
}));
$('#ctNome').addEventListener('input', e => { cust.nome = e.target.value; save(); updateCartLink(); });
$('#ctAddr').addEventListener('input', e => { cust.end = e.target.value; save(); updateCartLink(); });
$('#ctPay').addEventListener('change', e => { cust.pag = e.target.value; $('#ctChangeWrap').hidden = cust.pag !== 'Dinheiro'; save(); updateCartLink(); });
$('#ctChange').addEventListener('input', e => { cust.troco = e.target.value; save(); updateCartLink(); });
$('#ctWa').addEventListener('click', e => {
  const err = $('#ctErr'); let msg = '', field = null;
  if (!cust.nome.trim()){ msg = 'Informe seu nome para enviar o pedido.'; field = $('#ctNome'); }
  else if (cust.tipo === 'entrega' && !cust.end.trim()){ msg = 'Informe o endereço de entrega.'; field = $('#ctAddr'); }
  if (msg){ e.preventDefault(); err.textContent = msg; err.hidden = false; field.focus(); }
  else { err.hidden = true; }
});

document.addEventListener('keydown', e => {
  if (!openSheet) return;
  if (e.key === 'Escape'){ closeSheets(); return; }
  if (e.key !== 'Tab') return;
  const f = [...openSheet.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
    .filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
});

/* início */
load();
renderHero(); renderTabs(); renderMenu(); updateBar();
})();
