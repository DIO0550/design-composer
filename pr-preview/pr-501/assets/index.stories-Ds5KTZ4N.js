import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,r as a,t as o}from"./asset-grab-Dxo0oGuS.js";import{n as s,t as c}from"./token-selection-CgeM4SxX.js";import{n as l,t as u}from"./left-pane-DqzNOtW6.js";import{i as d,r as f}from"./left-pane-rail-C6ivF4tP.js";import{a as p,i as m,n as h,o as g,r as _}from"./sample-sidebar-document-CC27w3WA.js";var v=e((()=>{a()})),y,b,x,S,C,w,T,E,D,O,k,A,j;e((()=>{s(),v(),p(),_(),d(),t(),l(),y=r(),{fn:b}=__STORYBOOK_MODULE_TEST__,x={select:b(),reorder:b(),createComponent:b()},S={add:b(),reorder:b()},C={select:b(),add:b()},w={title:`features/sidebar/LeftPane`,component:u,parameters:{layout:`fullscreen`},args:{onSelectView:b(),selection:m(),tokenSelection:c.create(h,n.none),isFrozen:!1,renaming:n.none,artboard:S,node:x,rename:g(),token:C,grab:o},decorators:[e=>(0,y.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,y.jsx)(e,{})})]},T={name:`Layers（ツリー）`,args:{view:f.Layers}},E={name:`Assets（部品のパレット）`,args:{view:f.Assets}},D={name:`Tokens（トークン一覧）`,args:{view:f.Tokens}},O={name:`Assets（行を掴んで運んでいる）`,args:{view:f.Assets,grab:i(`primary-button`)}},k={name:`Layers（ノードを選択中）`,args:{view:f.Layers,selection:m(`home-title`)}},A={name:`Layers（凍結中）`,args:{view:f.Layers,isFrozen:!0}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...O.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`。掴んでいる行だけが青くなる。",...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title")
  }
}`,...k.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true
  }
}`,...A.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`。見出しの右端が `凍結中` になる。淡色と操\n作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...A.parameters?.docs?.description}}},j=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{E as Assets,O as AssetsGrabbed,T as Layers,A as LayersFrozen,k as LayersSelected,D as Tokens,j as __namedExportsOrder,w as default};