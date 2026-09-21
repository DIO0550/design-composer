import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CPpfsGoD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./token-selection-Bvtn7Y3x.js";import{i as o,n as s,t as c}from"./left-pane-D87JPaov.js";import{r as l}from"./left-pane-rail-iR8BPs_0.js";import{n as u,r as d,t as f}from"./asset-grab-DcOt9yGx.js";import{a as p,i as m,n as h,o as g,r as _}from"./sample-sidebar-document-DFdP46pR.js";var v=e((()=>{d()})),y=e((()=>{p(),_()})),b,x,S,C,w,T,E,D,O,k,A,j,M;e((()=>{i(),v(),o(),y(),t(),s(),b=r(),{fn:x}=__STORYBOOK_MODULE_TEST__,S={select:x(),reorder:x(),createComponent:x()},C={add:x(),reorder:x()},w={select:x(),add:x()},T={title:`features/editor/LeftPane`,component:c,parameters:{layout:`fullscreen`},args:{onSelectView:x(),selection:m(),tokenSelection:a.create(h,n.none),isFrozen:!1,renaming:n.none,artboard:C,node:S,rename:g(),token:w,grab:f},decorators:[e=>(0,b.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,b.jsx)(e,{})})]},E={name:`Layers（ツリー）`,args:{view:l.Layers}},D={name:`Assets（部品のパレット）`,args:{view:l.Assets}},O={name:`Tokens（トークン一覧）`,args:{view:l.Tokens}},k={name:`Assets（行を掴んで運んでいる）`,args:{view:l.Assets,grab:u(`primary-button`)}},A={name:`Layers（ノードを選択中）`,args:{view:l.Layers,selection:m(`home-title`)}},j={name:`Layers（凍結中）`,args:{view:l.Layers,isFrozen:!0}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...k.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`。掴んでいる行だけが青くなる。",...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title")
  }
}`,...A.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...j.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`。見出しの右端が `凍結中` になる。淡色と操\n作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...j.parameters?.docs?.description}}},M=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{D as Assets,k as AssetsGrabbed,E as Layers,j as LayersFrozen,A as LayersSelected,O as Tokens,M as __namedExportsOrder,T as default};