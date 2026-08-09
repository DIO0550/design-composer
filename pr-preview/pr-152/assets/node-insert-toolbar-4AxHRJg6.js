import{n as e}from"./chunk-BneVvdWh.js";import{i as t,t as n}from"./primitive-schema-D0am81dU.js";import{t as r}from"./jsx-runtime-4HHWW5MW.js";import{n as i,t as a}from"./type-glyph-Cti7NM5o.js";function o({type:e,isEnabled:t,onClick:n}){return(0,c.jsx)(`button`,{type:`button`,"aria-label":`${e} を追加`,onClick:n,disabled:!t,title:t?void 0:l,className:`flex h-8 w-9 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent`,children:(0,c.jsx)(a,{kind:e})})}function s({isInsertEnabled:e,onInsert:n}){return(0,c.jsx)(`section`,{"aria-label":`挿入`,className:`-translate-x-1/2 absolute bottom-4 left-1/2 flex h-11 items-center gap-0.5 rounded-[13px] bg-white px-1.5 shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]`,children:t.map(t=>(0,c.jsx)(o,{type:t,isEnabled:e,onClick:()=>n({kind:`primitive`,type:t})},t))})}var c,l,u=e((()=>{n(),i(),c=r(),l=`子を持てるものを選ぶと追加できます`;try{s.displayName=`NodeInsertToolbar`,s.__docgenInfo={description:`キャンバスに浮かぶツールバー（UI 案 docs/Design Composer.html。Design notes の
「the canvas carries a floating toolbar instead of a status bar」/ #112）。

出すのはプリミティブの挿入だけ。UI 案はこの帯にポインタ（選択ツール）・\`#\`（artboard）・
\`◆\`（部品インスタンス）も並べているが、置いていない。ツールモードの概念が無く、
artboard の追加は未実装（#43）で、\`◆\` は Assets のドラッグ中に背景が付く状態表示で
ボタンですらないため。押しても何も起きないボタンを先に置くと、できない操作が画面に
ある状態になる（\`ArtboardList\` が UI 案の \`+\` を出していないのと同じ判断）。

ボタンの並びは \`PRIMITIVE_TYPES\` から作る。プリミティブが増えたときに画面側の一覧が
取り残されないようにするため（スキーマと二重管理しない）。

浮かせる位置指定をここが持つのは、浮いていること自体がこの部品の形だから
（UI 案の器が \`position:absolute; bottom:16px; left:50%\` を持っている）。
位置指定された祖先の中に置く必要があり、置き場は \`EditorLayout.CenterPane\`。
**この位置指定を落としたことはテストでは落ちない**（happy-dom は Tailwind を
解決しない）。気づく手段は Storybook の視覚差分だけなので、触るときは VRT を見ること。

影は Tailwind の階調に無い値なので UI 案の実測値をそのまま書いている。`,displayName:`NodeInsertToolbar`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/node-insert-toolbar/index.tsx`,methods:[],props:{isInsertEnabled:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/node-insert-toolbar/index.tsx`,name:`TypeLiteral`}],description:``,name:`isInsertEnabled`,required:!0,tags:{},type:{name:`boolean`}},onInsert:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/node-insert-toolbar/index.tsx`,name:`TypeLiteral`}],description:``,name:`onInsert`,required:!0,tags:{},type:{name:`(template: NodeTemplate) => void`}}},tags:{}}}catch{}}));export{u as n,s as t};