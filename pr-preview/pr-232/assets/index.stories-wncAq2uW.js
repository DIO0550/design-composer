import{n as e}from"./chunk-BneVvdWh.js";import{M as t,j as n}from"./primitive-schema-Bht3XqyD.js";import{f as r,n as i,p as a,r as o,t as s}from"./design-document-CXNsDfv9.js";import{t as c}from"./jsx-runtime-Cw9gq7QB.js";import{n as l,t as u}from"./component-list-B2kGLyC4.js";var d,f,p,m,h,g,_,v;e((()=>{a(),i(),t(),l(),d=c(),f={title:`features/editor/ComponentList`,component:u,parameters:{layout:`padded`},decorators:[e=>(0,d.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,d.jsx)(e,{})})],args:{sourceName:n.none}},p=s.create({components:o.Default.components,artboards:[r.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),m={name:`使用数のある部品`,args:{assets:s.componentAssets(p),isInsertEnabled:!0,onInsert:()=>{}}},h={name:`挿せる位置が無い`,args:{assets:s.componentAssets(p),isInsertEnabled:!1,onInsert:()=>{}}},g={name:`部品がない`,args:{assets:[],isInsertEnabled:!0,onInsert:()=>{}}},_={name:`選択中のインスタンスの元になっている部品がある`,args:{assets:s.componentAssets(p),sourceName:n.some(`primary-button`),isInsertEnabled:!0,onInsert:()=>{}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "使用数のある部品",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "挿せる位置が無い",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    isInsertEnabled: false,
    onInsert: () => {}
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "部品がない",
  args: {
    assets: [],
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "選択中のインスタンスの元になっている部品がある",
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    sourceName: Option.some("primary-button"),
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,..._.parameters?.docs?.source},description:{story:`インスタンスを選んでいる状態。元になっている部品の行だけが出どころとして光る。`,..._.parameters?.docs?.description}}},v=[`Default`,`InsertDisabled`,`Empty`,`SourceOfSelection`]}))();export{m as Default,g as Empty,h as InsertDisabled,_ as SourceOfSelection,v as __namedExportsOrder,f as default};