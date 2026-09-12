import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,r as s,t as c}from"./design-document-BHgzbP6n.js";import{n as l,t as u}from"./document-selection-AIqHpFFJ.js";import{n as d,t as f}from"./document-tree-C1U9Lrzo.js";import{a as p,i as m,o as h,r as g}from"./sample-sidebar-document-CC27w3WA.js";var _,v,y,b,x,S,C,w,T,E;e((()=>{i(),o(),l(),p(),g(),t(),d(),_=r(),{fn:v}=__STORYBOOK_MODULE_TEST__,y={title:`features/sidebar/DocumentTree`,component:f,parameters:{layout:`padded`},decorators:[e=>(0,_.jsx)(a,{children:(0,_.jsx)(`div`,{className:`p-3`,children:(0,_.jsx)(e,{})})})],args:{onSelect:v(),onReorder:v(),renaming:n.none,renameActions:h()}},b={name:`選択なし`,args:{selection:m()}},x={name:`別の artboard を選択中`,args:{selection:m(`settings`)}},S={name:`artboard 配下のノードを選択中`,args:{selection:m(`home-title`)}},C=u.fromNames(c.create({tokens:s.Default.tokens,components:s.Default.components,artboards:[{name:`nested`,width:360,height:240,props:{layout:`column`,gap:`md`,paddingRight:`lg`,paddingLeft:`lg`},children:[{name:`header`,type:`Text`,props:{content:`見出し`,typography:`heading`}},{name:`body`,type:`Box`,props:{layout:`column`,gap:`sm`},children:[{name:`body-text`,type:`Text`,props:{content:`本文`}},{name:`body-action`,ref:`primary-button`,overrides:{label:`送信`}}]},{name:`footer`,type:`Text`,props:{content:`脚注`}}]}]}),[]),w={name:`入れ子のノードと並べ替え`,args:{selection:C}},T={name:`行の名前を編集中`,args:{selection:m(`home-title`),renaming:n.some(`home-title`)}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("home-title")
  }
}`,...S.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "入れ子のノードと並べ替え",
  args: {
    selection: NestedSelection
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "行の名前を編集中",
  args: {
    selection: sampleSidebarSelection("home-title"),
    renaming: Option.some("home-title")
  }
}`,...T.parameters?.docs?.source},description:{story:`行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は UI 案が描いて
いないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見るために置く。`,...T.parameters?.docs?.description}}},E=[`Default`,`OtherArtboard`,`NodeSelected`,`Nested`,`Renaming`]}))();export{b as Default,w as Nested,S as NodeSelected,x as OtherArtboard,T as Renaming,E as __namedExportsOrder,y as default};