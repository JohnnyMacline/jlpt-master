/* N3 어휘 모의고사 생성기 (결정적 시드) — node tools/gen_mock.js > tools/mock_sets.json
 * 시험 구성(JLPT N3 文字・語彙): 問題1 読み 8 · 問題2 表記 6 · 問題3 文脈規定 11 · 問題4 言い換え 5 · 問題5 用法 5 = 35문항/세트
 * 300개 고유 어휘 → 9세트(315문항, 15문항은 다른 유형으로 재출제) */
const fs = require('fs');
const path = require('path');
const L = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split('\n');
const VOCAB = new Function(L[514] + ';return VOCAB')();

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rnd = mulberry32(20261116);
let R = rnd;   // 문제별 분포는 R을 문제 단위 시드로 교체해 독립 생성
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = (a,n) => shuffle(a).slice(0,n);
const hasKanji = s => /[一-龥々]/.test(s);
const KANJI = /[一-龥々]/g;

const SETS = 9, PER = {1:8, 2:6, 3:11, 4:5, 5:5};
const TOTAL = {}; for(const t in PER) TOTAL[t] = PER[t]*SETS;   // 72/54/99/45/45

const okEx = v => v.ex && v.ex.includes(v.jp);
const _seen = new Set();
const pool = VOCAB.filter(okEx).filter(v => !_seen.has(v.jp) && _seen.add(v.jp));

/* ---------- 어휘 300개 선정 (카테고리 비례) ---------- */
function stratified(cands, n){
  const by = {}; cands.forEach(v => (by[v.cat] = by[v.cat] || []).push(v));
  const cats = Object.keys(by);
  const out = []; const tot = cands.length;
  cats.forEach(c => { by[c] = shuffle(by[c]); });
  let alloc = {}; let sum = 0;
  cats.forEach(c => { alloc[c] = Math.floor(n * by[c].length / tot); sum += alloc[c]; });
  const order = cats.slice().sort((a,b)=>by[b].length-by[a].length);
  for(let i=0; sum<n; i=(i+1)%order.length){ alloc[order[i]]++; sum++; }
  cats.forEach(c => out.push(...by[c].slice(0, alloc[c])));
  return out;
}
// 문맥이 충분한(예문 8자 이상) 어휘만 3·4·5유형(문맥/유의/용법)에 사용 — 모호한 오답 방지
const OPEN = new Set(['v','n','adji','adjn','katakana']);
const longPool = pool.filter(v => v.ex.length >= 8);
const poolCtx = longPool.filter(v => OPEN.has(v.pos) || v.pos==='conj');
const synPool = longPool.filter(v => v.syn && v.syn.length && v.syn[0] !== v.jp);
const EXC = new Set((JSON.parse(fs.readFileSync(path.join(__dirname,'mock_ban.json'),'utf8'))['x'])||[]);
const t4words = stratified(synPool.filter(v => !EXC.has(v.id)), TOTAL[4]);
const t4ids = new Set(t4words.map(v=>v.id));
// 5유형(용법)은 동사만: 다른 단어의 예문에 대입했을 때 의미 충돌이 명확해 정답이 하나로 정해짐
const t5words = stratified(longPool.filter(v => v.pos==='v' && !t4ids.has(v.id) && !EXC.has(v.id)), TOTAL[5]);
const t5ids = new Set(t5words.map(v=>v.id));
const t3words = stratified(poolCtx.filter(v => !t4ids.has(v.id) && !t5ids.has(v.id) && !EXC.has(v.id)), TOTAL[3]);
const t3ids = new Set(t3words.map(v=>v.id));
const used34 = new Set([...t4ids, ...t3ids, ...t5ids]);
// 1·2유형(읽기/표기): 신규 어휘 111개 + 3·5유형 어휘 재출제 15개 → 고유 어휘 300개
const kNew = pool.filter(v => hasKanji(v.jp) && !used34.has(v.id));
const newK = stratified(kNew, TOTAL[1] + TOTAL[2] - 15);
const reuse = pick([...t3words, ...t5words].filter(v => hasKanji(v.jp) && v.jp.length >= 2), 15);
const k126 = shuffle([...newK, ...reuse]);
const t1words = k126.slice(0, TOTAL[1]);
const t2words = k126.slice(TOTAL[1]);

/* ---------- 읽기 오답 생성 (問題1) ---------- */
const VOICE = {か:'が',き:'ぎ',く:'ぐ',け:'げ',こ:'ご',さ:'ざ',し:'じ',す:'ず',せ:'ぜ',そ:'ぞ',た:'だ',ち:'じ',つ:'ず',て:'で',と:'ど',は:'ば',ひ:'び',ふ:'ぶ',へ:'べ',ほ:'ぼ',
               が:'か',ぎ:'き',ぐ:'く',げ:'け',ご:'こ',ざ:'さ',じ:'し',ず:'す',ぜ:'せ',ぞ:'そ',だ:'た',で:'て',ど:'と',ば:'は',び:'ひ',ぶ:'ふ',べ:'へ',ぼ:'ほ',ぱ:'は',ぴ:'ひ',ぷ:'ふ',ぺ:'へ',ぽ:'ほ'};
const ROWS = ['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','らりるれろ','がぎぐげご','ざじずぜぞ','だぢづでど','ばびぶべぼ'];
const VPAIR = {0:[4],4:[0,2],2:[4],1:[3],3:[1]};   // あ↔お(う) い↔え う↔お/あ 로 제한 (자연스러운 혼동)
function swapVowel(ch){
  for(const r of ROWS){ const i=r.indexOf(ch); if(i>=0){ const c=[0,1,2,3,4].filter(x=>x!==i && ((VPAIR[i]||[]).includes(x))); if(!c.length) return null; return r[c[Math.floor(R()*c.length)]]; } }
  return null;
}
const SMALL = 'ゃゅょっー';
function mutations(kana, keepTail){
  const tailLen = keepTail || 0;
  const head = tailLen ? kana.slice(0, kana.length - tailLen) : kana;
  const tail = tailLen ? kana.slice(kana.length - tailLen) : '';
  return mutHead(head).map(h => h + tail).filter(x => x !== kana);
}
function mutHead(kana){
  const cs = [...kana]; const out = new Set();
  const idxs = cs.map((c,i)=>i).filter(i => !SMALL.includes(cs[i]));
  const tryAdd = s => { if(s && s !== kana) out.add(s); };
  // 탁음/청음
  idxs.forEach(i => { if(VOICE[cs[i]]){ const a=cs.slice(); a[i]=VOICE[cs[i]]; tryAdd(a.join('')); } });
  // 모음 교체
  idxs.forEach(i => { const v = swapVowel(cs[i]); if(v){ const a=cs.slice(); a[i]=v; tryAdd(a.join('')); } });
  // 장음 추가/삭제
  for(let i=0;i<cs.length;i++){
    if((cs[i]==='う'||cs[i]==='い') && i>0){ const a=cs.slice(); a.splice(i,1); tryAdd(a.join('')); }
    if('おこそとのほもろごぞどぼよ'.includes(cs[i]) && !'うおいえ'.includes(cs[i+1]||'x')){ const a=cs.slice(); a.splice(i+1,0,'う'); tryAdd(a.join('')); }
    if('えけせてねへめれげぜでべ'.includes(cs[i]) && !'いうおえ'.includes(cs[i+1]||'x')){ const a=cs.slice(); a.splice(i+1,0,'い'); tryAdd(a.join('')); }
  }
  // 촉음 추가/삭제
  for(let i=1;i<cs.length;i++){
    if(cs[i]==='っ'){ const a=cs.slice(); a.splice(i,1); tryAdd(a.join('')); }
    else if('かきくけこさしすせそたちつてとぱぴぷぺぽ'.includes(cs[i]) && !'っんゃゅょ'.includes(cs[i-1]) && !'つち'.includes(cs[i])){ const a=cs.slice(); a.splice(i,0,'っ'); tryAdd(a.join('')); }
  }
  return [...out];
}
function readingOptions(v){
  // 송り仮名(끝 히라가나)는 유지하고 한자 부분 읽기만 변형
  const tl = (v.jp.match(/[ぁ-ん]+$/) || [''])[0];
  const keep = (tl && v.kana.endsWith(tl) && hasKanji(v.jp)) ? tl.length : 0;
  const m = shuffle(mutations(v.kana, keep));
  let opts = m.slice(0, 3);
  if(opts.length < 3){  // 송り仮名까지 포함해 다시 변형
    shuffle(mutations(v.kana, 0)).forEach(x => { if(opts.length<3 && !opts.includes(x)) opts.push(x); });
  }
  if(opts.length < 3){ // 부족하면 모음 위치를 바꿔 보충
    for(const k of shuffle(VOCAB.filter(x=>x.id!==v.id && [...x.kana].length===[...v.kana].length))){
      if(opts.length>=3) break; if(!opts.includes(k.kana) && k.kana!==v.kana) opts.push(k.kana);
    }
  }
  return opts;
}

/* ---------- 표기 오답 생성 (問題2) ---------- */
const allKanji = [...new Set(VOCAB.map(v=>v.jp).join('').match(KANJI) || [])];
const jpSet = new Set(VOCAB.map(v=>v.jp));
const CONF = '未末 土士 大太 見貝 目日 白百 午牛 休体 持待 作昨 使便 院完 校交 花化 語話 読売 買貸 場湯 週過 速遠 近返 動働 理里 親新 決快 返坂 荷何 暑署 閉開 開関 係孫 帰婦 究空 待侍 洋羊 注住 治始 計討 品晶 習羽 題顔 送迷 運遠 転軽 計詩 校板 旅族 配酒 悪亜 薬楽 英央 夜液 線練 係系 想相 材村 様檬 求球 温湿 度庶 知和 紙低 的約 酸酔 利刊 到致 折析 張帳 築策 貨貸 険検 億憶 積績 製制 製性 過週 落洛 験険 鳥島 住注 横構 座坐 医区 気汽 気記 予矛 歴暦 写与 集進 進集 準隼 暖緩 泊拍 宿宙 払仏 港巷 横黄 拾捨 取最 減滅 曲由 輸輪 輪論 郵垂';
const CONFMAP = {}; CONF.split(' ').forEach(p => { const [a,b]=[...p]; (CONFMAP[a]=CONFMAP[a]||[]).push(b); (CONFMAP[b]=CONFMAP[b]||[]).push(a); });
function writingOptions(v){
  const out = [];
  const cand = shuffle(VOCAB.filter(x => x.id!==v.id && hasKanji(x.jp) && x.kana!==v.kana && [...x.jp].length===[...v.jp].length));
  // 같은 한자를 공유하는 실제 어휘를 우선 (예: 運転↔運動)
  const myK = new Set(v.jp.match(KANJI)||[]);
  cand.filter(x => x.jp!==v.jp && (x.jp.match(KANJI)||[]).some(k=>myK.has(k))).slice(0,2).forEach(x => { if(!out.includes(x.jp)) out.push(x.jp); });
  // 한 글자만 바꾼 가짜 표기
  let guard = 0;
  while(out.length < 3 && guard++ < 200){
    const cs = [...v.jp]; const ki = cs.map((c,i)=>hasKanji(c)?i:-1).filter(i=>i>=0);
    const i = ki[Math.floor(R()*ki.length)];
    const cf = CONFMAP[cs[i]];
    const sub = (cf && R()<0.8) ? cf[Math.floor(R()*cf.length)] : allKanji[Math.floor(R()*allKanji.length)];
    if(sub === cs[i]) continue;
    cs[i] = sub; const w = cs.join('');
    if(w !== v.jp && !jpSet.has(w) && !out.includes(w)) out.push(w);
  }
  return out.slice(0,3);
}

/* ---------- 문제 생성 ---------- */
const mark = (ex, jp, rep) => ex.replace(jp, rep === undefined ? `{{${jp}}}` : rep);
const BAN = fs.existsSync(path.join(__dirname,'mock_ban.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname,'mock_ban.json'),'utf8')) : {};
function build(t, v){
  R = mulberry32(v.id*977 + t*31 + 7);
  const ban = new Set((BAN[v.id]||[]).concat(BAN['*']||[]));
  let q, opts, ans;
  if(t===1){
    q = mark(v.ex, v.jp);
    opts = [v.kana, ...readingOptions(v)];
  }else if(t===2){
    q = mark(v.ex, v.jp, `{{${v.kana}}}`);
    opts = [v.jp, ...writingOptions(v)];
  }else if(t===3){
    q = mark(v.ex, v.jp, '（　　　）');
    const others = shuffle(pool.filter(x => x.id!==v.id && !ban.has(x.jp) && x.pos===v.pos && x.cat!==v.cat && !(v.syn||[]).includes(x.jp) && !(v.ant||[]).includes(x.jp) && x.jp!==v.jp));
    const same = shuffle(pool.filter(x => x.id!==v.id && !ban.has(x.jp) && x.pos===v.pos && x.cat===v.cat && x.jp!==v.jp && !others.includes(x)));
    opts = [v.jp, ...[...others, ...same].slice(0,3).map(x=>x.jp)];
  }else if(t===4){
    q = mark(v.ex, v.jp);
    const s = v.syn[0];
    const dis = [];
    (v.ant||[]).slice(0,1).forEach(a => { if(a!==s) dis.push(a); });
    shuffle(pool.filter(x => !ban.has(x.jp) && x.id!==v.id && x.pos===v.pos && x.jp!==s && !(v.syn||[]).includes(x.jp) && !dis.includes(x.jp))).forEach(x => { if(dis.length<3) dis.push(x.jp); });
    opts = [s, ...dis];
  }else{
    q = v.jp;
    const seenS = new Set([v.ex]);
    const dis = [];
    shuffle(pool.filter(x => !ban.has(x.jp) && x.id!==v.id && x.pos===v.pos && x.jp!==v.jp && x.ex.length>=5)).forEach(x => {
      const sen = x.ex.replace(x.jp, v.jp);
      if(dis.length<3 && !seenS.has(sen) && !ban.has(sen)){ seenS.add(sen); dis.push(sen); }
    });
    opts = [v.ex, ...dis];
  }
  // 정답 위치 균등 배분
  const correct = opts[0];
  const order = shuffle([0,1,2,3]);
  const shuffled = order.map(i => opts[i]);
  ans = shuffled.indexOf(correct);
  R = rnd;
  return { t, w: v.id, q, o: shuffled, a: ans };
}

/* ---------- 세트 분배 (한 세트 내 동일 어휘 중복 금지) ---------- */
const slots = { 1:t1words, 2:t2words, 3:t3words, 4:t4words, 5:t5words };
let sets;
for(let attempt=0; attempt<5000; attempt++){
  sets = Array.from({length:SETS}, () => ({}));
  let ok = true;
  const wordSet = Array.from({length:SETS}, () => new Set());
  for(const t of [1,2,3,4,5]){
    const w = shuffle(slots[t]);
    for(let s=0;s<SETS && ok;s++){
      sets[s][t] = w.slice(s*PER[t], (s+1)*PER[t]);
      for(const v of sets[s][t]){ if(wordSet[s].has(v.id)){ ok=false; break; } wordSet[s].add(v.id); }
    }
    if(!ok) break;
  }
  if(ok) break;
  sets = null;
}
if(!sets) throw new Error('set assignment failed');

const byId = Object.fromEntries(VOCAB.map(v=>[v.id,v]));
const out = sets.map((s,i) => {
  const qs = [];
  for(const t of [1,2,3,4,5]) s[t].forEach(v => qs.push(build(t, v)));
  return { no: i+1, qs };
});
// 검증
const uniq = new Set(); out.forEach(s => s.qs.forEach(q => uniq.add(q.w)));
const errs = [];
out.forEach(s => s.qs.forEach((q,i) => {
  if(q.o.length!==4) errs.push(`set${s.no} q${i+1} t${q.t} options=${q.o.length}`);
  if(new Set(q.o).size!==4) errs.push(`set${s.no} q${i+1} t${q.t} dup options ${q.q} :: ${q.o.join(' / ')}`);
}));
console.error(`sets=${out.length} questions=${out.reduce((a,s)=>a+s.qs.length,0)} unique words=${uniq.size} errors=${errs.length}`);
errs.slice(0,10).forEach(e=>console.error(e));
process.stdout.write(JSON.stringify(out));
