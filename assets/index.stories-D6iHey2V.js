import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-ByzVpLNU.js";import{h as i,m as a,n as o,r as s,t as c}from"./design-document-CflW7GBc.js";import{n as l}from"./asset-grab-HzOpxWfJ.js";import{n as u,t as d}from"./asset-grab-CmppogPT.js";import{n as f,t as p}from"./component-list-DaIyvfZV.js";var m,h,g,_,v,y,b,x;e((()=>{i(),o(),d(),n(),f(),m=t(),h={title:`features/assets/ComponentList`,component:p,parameters:{layout:`padded`},decorators:[e=>(0,m.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,m.jsx)(e,{})})],args:{sourceName:r.none,grab:u()}},g=c.create({components:s.Default.components,artboards:[a.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),_={name:`使用数のある部品`,args:{assets:c.componentAssets(g)}},v={name:`部品がない`,args:{assets:[]}},y={name:`行を掴んで運んでいる`,args:{assets:c.componentAssets(g),grab:l(`primary-button`)}},b={name:`選択中のインスタンスの元になっている部品がある`,args:{assets:c.componentAssets(g),sourceName:r.some(`primary-button`)}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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