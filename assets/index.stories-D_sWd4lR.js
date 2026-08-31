import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./left-pane-shell-Cbogr8w8.js";import{n as i,t as a}from"./Option-CTa-i89e.js";import{h as o,m as s,n as c,r as l,t as u}from"./design-document-D-JQbxXA.js";import{n as d}from"./asset-grab-BzHDjIhg.js";import{n as f,t as p}from"./asset-grab-DuEBgisi.js";import{n as m,t as h}from"./component-list-ueuzJnjA.js";var g,_,v,y,b,x,S,C;e((()=>{n(),o(),c(),p(),i(),m(),g=t(),_={title:`features/assets/ComponentList`,component:h,parameters:{layout:`padded`},decorators:[e=>(0,g.jsx)(r,{children:(0,g.jsx)(`div`,{className:`p-3`,children:(0,g.jsx)(e,{})})})],args:{sourceName:a.none,grab:f()}},v=u.create({components:l.Default.components,artboards:[s.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),y={name:`使用数のある部品`,args:{assets:u.componentAssets(v)}},b={name:`部品がない`,args:{assets:[]}},x={name:`行を掴んで運んでいる`,args:{assets:u.componentAssets(v),grab:d(`primary-button`)}},S={name:`選択中のインスタンスの元になっている部品がある`,args:{assets:u.componentAssets(v),sourceName:a.some(`primary-button`)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "使用数のある部品",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument)
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "部品がない",
  args: {
    assets: []
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "行を掴んで運んでいる",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    grab: grabbingComponent("primary-button")
  }
}`,...x.parameters?.docs?.source},description:{story:`行を掴んでキャンバスへ運んでいる状態（UI 案 docs/Design Composer.html の
\`3a · ASSETS\`）。掴んでいる行だけが青くなる。

**青と左端の帯はテストでは見えない**（happy-dom は Tailwind を解決しない）。
出どころの紫と取り違えていないかを確かめる手段はこのストーリーの視覚差分だけ。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "選択中のインスタンスの元になっている部品がある",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    sourceName: Option.some("primary-button")
  }
}`,...S.parameters?.docs?.source},description:{story:`インスタンスを選んでいる状態。元になっている部品の行だけが出どころとして光る。`,...S.parameters?.docs?.description}}},C=[`Default`,`Empty`,`Grabbed`,`SourceOfSelection`]}))();export{y as Default,b as Empty,x as Grabbed,S as SourceOfSelection,C as __namedExportsOrder,_ as default};