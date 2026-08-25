import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-CEQn841D.js";import{n as i,r as a,t as o}from"./asset-grab-9SflD_8u.js";import{n as s,t as c}from"./token-selection-CkonydU8.js";import{n as l,t as u}from"./left-pane-B8l7feS1.js";import{i as d,r as f}from"./left-pane-rail-DySK-o_q.js";import{i as p,n as m,r as h}from"./sample-sidebar-document-BVOkstpS.js";var g=e((()=>{a()})),_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{s(),g(),h(),d(),n(),l(),_=t(),{fn:v}=__STORYBOOK_MODULE_TEST__,y={select:v(),reorder:v(),createComponent:v()},b={add:v(),reorder:v()},x={select:v(),add:v()},S={title:`features/sidebar/LeftPane`,component:u,parameters:{layout:`fullscreen`},args:{onSelectView:v(),selection:p(),tokenSelection:c.create(m,r.none),isFrozen:!1,artboard:b,node:y,token:x,grab:o},decorators:[e=>(0,_.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,_.jsx)(e,{})})]},C={name:`Layers（ツリー）`,args:{view:f.Layers}},w={name:`Assets（部品のパレット）`,args:{view:f.Assets}},T={name:`Tokens（トークン一覧）`,args:{view:f.Tokens}},E={name:`Assets（行を掴んで運んでいる）`,args:{view:f.Assets,grab:i(`primary-button`)}},D={name:`Layers（ノードを選択中）`,args:{view:f.Layers,selection:p(`home-title`)}},O={name:`Layers（凍結中）`,args:{view:f.Layers,isFrozen:!0}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...E.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`（#203）。\n掴んでいる行だけが青くなる。",...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title")
  }
}`,...D.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...O.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に\nなる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...O.parameters?.docs?.description}}},k=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{w as Assets,E as AssetsGrabbed,C as Layers,O as LayersFrozen,D as LayersSelected,T as Tokens,k as __namedExportsOrder,S as default};