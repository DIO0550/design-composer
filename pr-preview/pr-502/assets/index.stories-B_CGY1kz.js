import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./left-pane-shell-Bg7Fse5V.js";import{n as o,r as s,t as c}from"./artboard-list-9wmBls-J.js";import{a as l,i as u,o as d,r as f,t as p}from"./sample-sidebar-document-CVa56hqg.js";function m(e){return o.full(e.document.artboards)}var h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{i(),l(),f(),t(),s(),h=r(),{fn:g}=__STORYBOOK_MODULE_TEST__,_={title:`features/sidebar/ArtboardList`,component:c,parameters:{layout:`padded`},decorators:[e=>(0,h.jsx)(a,{children:(0,h.jsx)(`div`,{className:`p-3`,children:(0,h.jsx)(e,{})})})],args:{onSelect:g(),artboardActions:{add:g(),reorder:g()},renaming:n.none,renameActions:d()}},v=u(),y={name:`選択なし（先頭が今の 1 枚）`,args:{selection:v,listing:m(v)}},b=u(`settings`),x={name:`別の artboard を選択中`,args:{selection:b,listing:m(b)}},S=u(`settings-card`),C={name:`artboard 配下のノードを選択中`,args:{selection:S,listing:m(S)}},w={name:`artboard がない`,args:{selection:p,listing:m(p)}},T={name:`絞り込みで 1 枚だけ残っている`,args:{selection:v,listing:o.filtered(v.document.artboards.slice(0,1))}},E={name:`一致するものがない`,args:{selection:v,listing:o.filtered([])}},D={name:`行の名前を編集中`,args:{selection:v,listing:m(v),renaming:n.some(`home`)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    selection: DefaultSelection,
    listing: fullListing(DefaultSelection)
  }
}`,...y.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: SettingsSelection,
    listing: fullListing(SettingsSelection)
  }
}`,...x.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: NodeSelection,
    listing: fullListing(NodeSelection)
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: EmptySidebarSelection,
    listing: fullListing(EmptySidebarSelection)
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "絞り込みで 1 枚だけ残っている",
  args: {
    selection: DefaultSelection,
    listing: ArtboardListing.filtered(DefaultSelection.document.artboards.slice(0, 1))
  }
}`,...T.parameters?.docs?.source},description:{story:`絞り込みで 1 枚だけ残った状態（docs/06-ui.md「絞り込み」）。行の見た目は絞っていない
ときと変わらず、掴む口だけが配られない。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "一致するものがない",
  args: {
    selection: DefaultSelection,
    listing: ArtboardListing.filtered([])
  }
}`,...E.parameters?.docs?.source},description:{story:"どこにも一致が無い状態。見出しと `+` は残り、行の場所に知らせが出る。",...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "行の名前を編集中",
  args: {
    selection: DefaultSelection,
    listing: fullListing(DefaultSelection),
    renaming: Option.some("home")
  }
}`,...D.parameters?.docs?.source},description:{story:`artboard の行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は
UI 案が描いていないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見る。`,...D.parameters?.docs?.description}}},O=[`Default`,`Selected`,`NodeSelected`,`Empty`,`Filtered`,`NoMatch`,`Renaming`]}))();export{y as Default,w as Empty,T as Filtered,E as NoMatch,C as NodeSelected,D as Renaming,x as Selected,O as __namedExportsOrder,_ as default};