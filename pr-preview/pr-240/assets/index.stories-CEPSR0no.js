import{n as e}from"./chunk-BneVvdWh.js";import{G as t,K as n,f as r,n as i,p as a,r as o,t as s}from"./design-document-CmzPaaBf.js";import{t as c}from"./jsx-runtime-Cw9gq7QB.js";import{n as l,r as u,t as d}from"./asset-grab-BUE_ewEt.js";import{n as f,t as p}from"./component-list-S66RIZ4u.js";var m,h,g,_,v,y,b,x;e((()=>{a(),i(),l(),n(),f(),m=c(),h={title:`features/editor/ComponentList`,component:p,parameters:{layout:`padded`},decorators:[e=>(0,m.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,m.jsx)(e,{})})],args:{sourceName:t.none,grab:u()}},g=s.create({components:o.Default.components,artboards:[r.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),_={name:`使用数のある部品`,args:{assets:s.componentAssets(g)}},v={name:`部品がない`,args:{assets:[]}},y={name:`行を掴んで運んでいる`,args:{assets:s.componentAssets(g),grab:d(`primary-button`)}},b={name:`選択中のインスタンスの元になっている部品がある`,args:{assets:s.componentAssets(g),sourceName:t.some(`primary-button`)}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "使用数のある部品",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument)
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "部品がない",
  args: {
    assets: []
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "行を掴んで運んでいる",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    grab: grabbingComponent("primary-button")
  }
}`,...y.parameters?.docs?.source},description:{story:`行を掴んでキャンバスへ運んでいる状態（UI 案 docs/Design Composer.html の
\`3a · ASSETS\`）。掴んでいる行だけが青くなる。

**青と左端の帯はテストでは見えない**（happy-dom は Tailwind を解決しない）。
出どころの紫と取り違えていないかを確かめる手段はこのストーリーの視覚差分だけ。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "選択中のインスタンスの元になっている部品がある",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    sourceName: Option.some("primary-button")
  }
}`,...b.parameters?.docs?.source},description:{story:`インスタンスを選んでいる状態。元になっている部品の行だけが出どころとして光る。`,...b.parameters?.docs?.description}}},x=[`Default`,`Empty`,`Grabbed`,`SourceOfSelection`]}))();export{_ as Default,v as Empty,y as Grabbed,b as SourceOfSelection,x as __namedExportsOrder,h as default};