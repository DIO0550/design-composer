import{n as e}from"./chunk-BneVvdWh.js";import{M as t,j as n}from"./primitive-schema-Ke4zSQuu.js";import{n as r,r as i,t as a}from"./asset-grab-COplsV-t.js";import{t as o}from"./jsx-runtime-4HHWW5MW.js";import{n as s,t as c}from"./token-selection-Bwkb2tHj.js";import{n as l,t as u}from"./left-pane-DQG97YBG.js";import{i as d,r as f}from"./left-pane-rail-Dnx_D0kG.js";import{i as p,n as m,r as h}from"./sample-sidebar-document-bg35SP9L.js";var g=e((()=>{i()})),_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{s(),g(),h(),d(),t(),l(),_=o(),{fn:v}=__STORYBOOK_MODULE_TEST__,y={select:v(),reorder:v(),createComponent:v()},b={select:v(),add:v()},x={title:`features/sidebar/LeftPane`,component:u,parameters:{layout:`fullscreen`},args:{onSelectView:v(),selection:p(),tokenSelection:c.create(m,n.none),isFrozen:!1,node:y,token:b,grab:a},decorators:[e=>(0,_.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,_.jsx)(e,{})})]},S={name:`Layers（ツリー）`,args:{view:f.Layers}},C={name:`Assets（部品のパレット）`,args:{view:f.Assets}},w={name:`Tokens（トークン一覧）`,args:{view:f.Tokens}},T={name:`Assets（行を掴んで運んでいる）`,args:{view:f.Assets,grab:r(`primary-button`)}},E={name:`Layers（ノードを選択中）`,args:{view:f.Layers,selection:p(`home-title`)}},D={name:`Layers（凍結中）`,args:{view:f.Layers,isFrozen:!0}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...T.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`（#203）。\n掴んでいる行だけが青くなる。",...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title")
  }
}`,...E.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...D.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に\nなる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...D.parameters?.docs?.description}}},O=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{C as Assets,T as AssetsGrabbed,S as Layers,D as LayersFrozen,E as LayersSelected,w as Tokens,O as __namedExportsOrder,x as default};