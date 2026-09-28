import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./layers-panel-BAY5PBU2.js";import{n as o,t as s}from"./left-pane-DZCp76c0.js";import{i as c,r as l}from"./left-pane-rail-BtaLodf3.js";import{a as u,i as d,n as f,r as p}from"./sample-sidebar-document-Cif7adsP.js";import{n as m,t as h}from"./sample-context-menu-actions-Dx6HpF3u.js";function g(...e){return{kind:`searchable`,searchLabel:`Search layers`,footer:n.none,render:t=>(0,v.jsx)(a,{query:t,selection:p(...e),renaming:n.none,artboard:x,node:b,rename:u(),contextMenu:m()})}}function _(){return{[l.Layers]:g(),[l.Assets]:{kind:`searchable`,searchLabel:`Search assets`,footer:n.some((0,v.jsx)(`p`,{className:`border-gray-300 border-t p-3 text-gray-400 text-xs`,children:`差し込まれたフッター`})),render:e=>(0,v.jsxs)(`p`,{className:`text-gray-400 text-xs`,children:[`差し込まれた中身（検索語: `,e===``?`なし`:e,`）`]})},[l.Tokens]:{kind:`plain`,footer:n.none,render:()=>(0,v.jsx)(`p`,{className:`text-gray-400 text-xs`,children:`検索欄を持たない行き先`})}}}var v,y,b,x,S,C,w,T,E,D,O;e((()=>{h(),d(),f(),i(),c(),t(),o(),v=r(),{fn:y}=__STORYBOOK_MODULE_TEST__,b={select:y(),reorder:y()},x={add:y(),reorder:y()},S={title:`features/editor/features/sidebar/LeftPane`,component:s,parameters:{layout:`fullscreen`},args:{onSelectView:y(),views:_(),isFrozen:!1},decorators:[e=>(0,v.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,v.jsx)(e,{})})]},C={name:`Layers（ツリー）`,args:{view:l.Layers}},w={name:`Assets（フッターを持つ行き先）`,args:{view:l.Assets}},T={name:`Tokens（検索欄を持たない行き先）`,args:{view:l.Tokens}},E={name:`Layers（ノードを選択中）`,args:{view:l.Layers,views:{..._(),[l.Layers]:g(`home-title`)}}},D={name:`Layers（凍結中）`,args:{view:l.Layers,isFrozen:!0}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Assets（フッターを持つ行き先）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...w.parameters?.docs?.source},description:{story:`フッターを持つ行き先。パネルの下端に差し込まれたものが固定される。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Tokens（検索欄を持たない行き先）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...T.parameters?.docs?.source},description:{story:`検索欄を持たない行き先。見出しの直下に欄が出ない。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    views: {
      ...sampleViews(),
      [LeftPaneViews.Layers]: layersView("home-title")
    }
  }
}`,...E.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...D.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`。見出しの右端が `凍結中` になる。淡色と操\n作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...D.parameters?.docs?.description}}},O=[`Layers`,`Assets`,`Tokens`,`LayersSelected`,`LayersFrozen`]}))();export{w as Assets,C as Layers,D as LayersFrozen,E as LayersSelected,T as Tokens,O as __namedExportsOrder,S as default};