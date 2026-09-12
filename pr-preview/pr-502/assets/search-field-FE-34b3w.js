import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";function n(){return(0,i.jsxs)(`span`,{"aria-hidden":`true`,className:`flex shrink-0 items-center`,children:[(0,i.jsx)(`span`,{className:`size-2 rounded-full border-[1.5px] border-gray-400`}),(0,i.jsx)(`span`,{className:`-ml-px h-px w-1 rotate-45 bg-gray-400`})]})}function r({label:e,value:t,onChange:r}){return(0,i.jsxs)(`div`,{className:`flex h-7 items-center gap-2 rounded border border-gray-300 px-2`,children:[(0,i.jsx)(n,{}),(0,i.jsx)(`input`,{type:`search`,"aria-label":e,placeholder:e,value:t,onChange:e=>r(e.target.value),className:`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400`})]})}var i,a,o=e((()=>{i=t(),a=`一致するものがありません`;try{r.displayName=`SearchField`,r.__docgenInfo={description:`名前で中身を絞る検索欄（UI 案 docs/Design Composer.html の \`Search layers\` /
\`Search assets\` / docs/06-ui.md「絞り込み」）。

打った語を消す入口は欄自身が持つもの（消すしるしと Esc）を使い、専用のボタンを描かな
い。検索用の入力欄はどちらも自前で持つため。

字は左ペインの他の行と同じ大きさにする。UI 案の欄は 11px だが、この画面は左ペイン全体が
UI 案より 1 段大きい寸法で通っているので、欄だけを案の実測値へ寄せると行より小さくなる。

何を絞るかは知らない。持っているのは案内文と今の語と、打たれたことを伝える口だけ。`,displayName:`SearchField`,filePath:`/home/runner/work/design-composer/design-composer/src/components/search-field/index.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/search-field/index.tsx`,name:`TypeLiteral`}],description:`案内文。読み上げ名も兼ねる（UI 案の綴り）`,name:`label`,required:!0,tags:{},type:{name:`string`}},value:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/search-field/index.tsx`,name:`TypeLiteral`}],description:``,name:`value`,required:!0,tags:{},type:{name:`string`}},onChange:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/search-field/index.tsx`,name:`TypeLiteral`}],description:``,name:`onChange`,required:!0,tags:{},type:{name:`(value: string) => void`}}},tags:{}}}catch{}try{a.displayName=`NoMatchMessage`,a.__docgenInfo={description:`絞り込んで 1 つも残らなかったときの知らせ（docs/06-ui.md「絞り込み」）。

欄と同じ場所に置くのは、これが打った語に対する答えだから。一覧の側に持たせると、
欄を持つパネルの数だけ同じ文言が増える。`,displayName:`NoMatchMessage`,filePath:`/home/runner/work/design-composer/design-composer/src/components/search-field/index.tsx`,methods:[],props:{},tags:{}}}catch{}}));export{r as n,o as r,a as t};