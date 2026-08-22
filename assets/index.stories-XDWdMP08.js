import{n as e}from"./chunk-BneVvdWh.js";import{M as t,j as n}from"./primitive-schema-Ke4zSQuu.js";import{n as r,r as i,t as a}from"./asset-grab-COplsV-t.js";import{t as o}from"./jsx-runtime-4HHWW5MW.js";import{n as s,t as c}from"./token-selection-D21CBGFl.js";import{n as l,t as u}from"./left-pane-DRQ05s6r.js";import{i as d,r as f}from"./left-pane-rail-CnLvE9nd.js";import{i as p,n as m,r as h}from"./sample-sidebar-document-oJI1ZoeN.js";var g,_,v,y,b,x,S,C,w,T,E,D;e((()=>{s(),i(),h(),d(),t(),l(),g=o(),{fn:_}=__STORYBOOK_MODULE_TEST__,v={select:_(),reorder:_(),createComponent:_()},y={select:_(),add:_()},b={title:`features/sidebar/LeftPane`,component:u,parameters:{layout:`fullscreen`},args:{onSelectView:_(),selection:p(),tokenSelection:c.create(m,n.none),isFrozen:!1,node:v,token:y,grab:a},decorators:[e=>(0,g.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,g.jsx)(e,{})})]},x={name:`Layers（ツリー）`,args:{view:f.Layers}},S={name:`Assets（部品のパレット）`,args:{view:f.Assets}},C={name:`Tokens（トークン一覧）`,args:{view:f.Tokens}},w={name:`Assets（行を掴んで運んでいる）`,args:{view:f.Assets,grab:r(`primary-button`)}},T={name:`Layers（ノードを選択中）`,args:{view:f.Layers,selection:p(`home-title`)}},E={name:`Layers（凍結中）`,args:{view:f.Layers,isFrozen:!0}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...w.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`（#203）。\n掴んでいる行だけが青くなる。",...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title")
  }
}`,...T.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...E.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に\nなる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...E.parameters?.docs?.description}}},D=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{S as Assets,w as AssetsGrabbed,x as Layers,E as LayersFrozen,T as LayersSelected,C as Tokens,D as __namedExportsOrder,b as default};