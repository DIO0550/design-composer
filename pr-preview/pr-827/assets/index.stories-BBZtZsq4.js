import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./layers-panel-mICIkvet.js";import{n as o,t as s}from"./left-pane-BRBdBYki.js";import{i as c,r as l}from"./left-pane-rail-BELFINIw.js";import{a as u,i as d,n as f,r as p}from"./sample-sidebar-document-BPckKRnW.js";function m(...e){return{kind:`searchable`,searchLabel:`Search layers`,footer:n.none,render:t=>(0,g.jsx)(a,{query:t,selection:p(...e),renaming:n.none,artboard:y,node:v,rename:u()})}}function h(){return{[l.Layers]:m(),[l.Assets]:{kind:`searchable`,searchLabel:`Search assets`,footer:n.some((0,g.jsx)(`p`,{className:`border-gray-300 border-t p-3 text-gray-400 text-xs`,children:`差し込まれたフッター`})),render:e=>(0,g.jsxs)(`p`,{className:`text-gray-400 text-xs`,children:[`差し込まれた中身（検索語: `,e===``?`なし`:e,`）`]})},[l.Tokens]:{kind:`plain`,footer:n.none,render:()=>(0,g.jsx)(`p`,{className:`text-gray-400 text-xs`,children:`検索欄を持たない行き先`})}}}var g,_,v,y,b,x,S,C,w,T,E;e((()=>{d(),f(),i(),c(),t(),o(),g=r(),{fn:_}=__STORYBOOK_MODULE_TEST__,v={select:_(),reorder:_()},y={add:_(),reorder:_()},b={title:`features/editor/features/sidebar/LeftPane`,component:s,parameters:{layout:`fullscreen`},args:{onSelectView:_(),views:h(),isFrozen:!1},decorators:[e=>(0,g.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,g.jsx)(e,{})})]},x={name:`Layers（ツリー）`,args:{view:l.Layers}},S={name:`Assets（フッターを持つ行き先）`,args:{view:l.Assets}},C={name:`Tokens（検索欄を持たない行き先）`,args:{view:l.Tokens}},w={name:`Layers（ノードを選択中）`,args:{view:l.Layers,views:{...h(),[l.Layers]:m(`home-title`)}}},T={name:`Layers（凍結中）`,args:{view:l.Layers,isFrozen:!0}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "Assets（フッターを持つ行き先）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...S.parameters?.docs?.source},description:{story:`フッターを持つ行き先。パネルの下端に差し込まれたものが固定される。`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Tokens（検索欄を持たない行き先）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...C.parameters?.docs?.source},description:{story:`検索欄を持たない行き先。見出しの直下に欄が出ない。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    views: {
      ...sampleViews(),
      [LeftPaneViews.Layers]: layersView("home-title")
    }
  }
}`,...w.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...T.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`。見出しの右端が `凍結中` になる。淡色と操\n作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...T.parameters?.docs?.description}}},E=[`Layers`,`Assets`,`Tokens`,`LayersSelected`,`LayersFrozen`]}))();export{S as Assets,x as Layers,T as LayersFrozen,w as LayersSelected,C as Tokens,E as __namedExportsOrder,b as default};