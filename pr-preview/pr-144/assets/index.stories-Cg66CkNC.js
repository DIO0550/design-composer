import{n as e}from"./chunk-BneVvdWh.js";import{d as t,f as n,n as r,r as i,t as a}from"./design-document-BQp59__q.js";import{t as o}from"./jsx-runtime-4HHWW5MW.js";import{n as s,t as c}from"./component-list-hkwWnMs0.js";var l,u,d,f,p,m,h;e((()=>{n(),r(),s(),l=o(),u={title:`features/editor/ComponentList`,component:c,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,l.jsx)(e,{})})]},d=a.create({components:i.DEFAULT.components,artboards:[t.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),f={name:`使用数のある部品`,args:{assets:a.componentAssets(d),isInsertEnabled:!0,onInsert:()=>{}}},p={name:`挿せる位置が無い`,args:{assets:a.componentAssets(d),isInsertEnabled:!1,onInsert:()=>{}}},m={name:`部品がない`,args:{assets:[],isInsertEnabled:!0,onInsert:()=>{}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "使用数のある部品",
  args: {
    assets: DesignDocument.componentAssets(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "挿せる位置が無い",
  args: {
    assets: DesignDocument.componentAssets(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: false,
    onInsert: () => {}
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "部品がない",
  args: {
    assets: [],
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`InsertDisabled`,`Empty`]}))();export{f as Default,m as Empty,p as InsertDisabled,h as __namedExportsOrder,u as default};