import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,t as s}from"./artboard-list-D3T66ch8.js";import{a as c,i as l,o as u,r as d,t as f}from"./sample-sidebar-document-CC27w3WA.js";var p,m,h,g,_,v,y,b,x;e((()=>{i(),c(),d(),t(),o(),p=r(),{fn:m}=__STORYBOOK_MODULE_TEST__,h={title:`features/sidebar/ArtboardList`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,p.jsx)(a,{children:(0,p.jsx)(`div`,{className:`p-3`,children:(0,p.jsx)(e,{})})})],args:{onSelect:m(),artboardActions:{add:m(),reorder:m()},renaming:n.none,renameActions:u()}},g={name:`選択なし（先頭が今の 1 枚）`,args:{selection:l()}},_={name:`別の artboard を選択中`,args:{selection:l(`settings`)}},v={name:`artboard 配下のノードを選択中`,args:{selection:l(`settings-card`)}},y={name:`artboard がない`,args:{selection:f}},b={name:`行の名前を編集中`,args:{selection:l(),renaming:n.some(`home`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("settings-card")
  }
}`,...v.parameters?.docs?.source},description:{story:`配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: EmptySidebarSelection
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "行の名前を編集中",
  args: {
    selection: sampleSidebarSelection(),
    renaming: Option.some("home")
  }
}`,...b.parameters?.docs?.source},description:{story:`artboard の行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は
UI 案が描いていないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見る。`,...b.parameters?.docs?.description}}},x=[`Default`,`Selected`,`NodeSelected`,`Empty`,`Renaming`]}))();export{g as Default,y as Empty,v as NodeSelected,b as Renaming,_ as Selected,x as __namedExportsOrder,h as default};