import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,r as s,t as c}from"./design-document-BnapeFic.js";import{n as l,t as u}from"./name-filter-BUCQHf9M.js";import{n as d,t as f}from"./document-selection-C-NYhvz9.js";import{n as p,t as m}from"./document-tree-CtIcXAPx.js";import{a as h,i as g,o as _,r as v}from"./sample-sidebar-document-CVa56hqg.js";var y,b,x,S,C,w,T,E,D,O,k;e((()=>{i(),o(),d(),l(),h(),v(),t(),p(),y=r(),{fn:b}=__STORYBOOK_MODULE_TEST__,x={title:`features/sidebar/DocumentTree`,component:m,parameters:{layout:`padded`},decorators:[e=>(0,y.jsx)(a,{children:(0,y.jsx)(`div`,{className:`p-3`,children:(0,y.jsx)(e,{})})})],args:{onSelect:b(),onReorder:b(),renaming:n.none,filter:n.none,renameActions:_()}},S={name:`選択なし`,args:{selection:g()}},C={name:`別の artboard を選択中`,args:{selection:g(`settings`)}},w={name:`artboard 配下のノードを選択中`,args:{selection:g(`home-title`)}},T={name:`絞り込みで一致した行だけが出ている`,args:{selection:g(),filter:u.create(`title`)}},E=f.fromNames(c.create({tokens:s.Default.tokens,components:s.Default.components,artboards:[{name:`nested`,width:360,height:240,props:{layout:`column`,gap:`md`,paddingRight:`lg`,paddingLeft:`lg`},children:[{name:`header`,type:`Text`,props:{content:`見出し`,typography:`heading`}},{name:`body`,type:`Box`,props:{layout:`column`,gap:`sm`},children:[{name:`body-text`,type:`Text`,props:{content:`本文`}},{name:`body-action`,ref:`primary-button`,overrides:{label:`送信`}}]},{name:`footer`,type:`Text`,props:{content:`脚注`}}]}]}),[]),D={name:`入れ子のノードと並べ替え`,args:{selection:E}},O={name:`行の名前を編集中`,args:{selection:g(`home-title`),renaming:n.some(`home-title`)}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("home-title")
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "絞り込みで一致した行だけが出ている",
  args: {
    selection: sampleSidebarSelection(),
    filter: NameFilter.create("title")
  }
}`,...T.parameters?.docs?.source},description:{story:`絞り込みで一致した行とその祖先だけが残った状態（docs/06-ui.md「絞り込み」）。
祖先の行は通常の行のままで、絞り込みのための見た目は持たない。`,...T.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "入れ子のノードと並べ替え",
  args: {
    selection: NestedSelection
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "行の名前を編集中",
  args: {
    selection: sampleSidebarSelection("home-title"),
    renaming: Option.some("home-title")
  }
}`,...O.parameters?.docs?.source},description:{story:`行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は UI 案が描いて
いないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見るために置く。`,...O.parameters?.docs?.description}}},k=[`Default`,`OtherArtboard`,`NodeSelected`,`Filtered`,`Nested`,`Renaming`]}))();export{S as Default,T as Filtered,D as Nested,w as NodeSelected,C as OtherArtboard,O as Renaming,k as __namedExportsOrder,x as default};