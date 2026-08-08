import{n as e}from"./chunk-BneVvdWh.js";import{d as t,n,r,t as i,u as a}from"./design-document-BobjO42E.js";import{t as o}from"./jsx-runtime-4HHWW5MW.js";import{n as s,t as c}from"./component-list-CMoAV8yB.js";var l,u,d,f,p,m,h;e((()=>{t(),n(),s(),l=o(),u={title:`features/editor/ComponentList`,component:c,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,l.jsx)(e,{})})]},d=i.create({components:r.DEFAULT.components,artboards:[a.create({name:`home`,width:360,height:240,children:[{name:`home-login`,ref:`primary-button`},{name:`home-cancel`,ref:`primary-button`},{name:`home-card`,ref:`card`}]})]}),f={name:`使用数のある部品`,args:{refCounts:i.componentRefCounts(d),isInsertEnabled:!0,onInsert:()=>{}}},p={name:`挿せる位置が無い`,args:{refCounts:i.componentRefCounts(d),isInsertEnabled:!1,onInsert:()=>{}}},m={name:`部品がない`,args:{refCounts:[],isInsertEnabled:!0,onInsert:()=>{}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "使用数のある部品",
  args: {
    refCounts: DesignDocument.componentRefCounts(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "挿せる位置が無い",
  args: {
    refCounts: DesignDocument.componentRefCounts(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: false,
    onInsert: () => {}
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "部品がない",
  args: {
    refCounts: [],
    isInsertEnabled: true,
    onInsert: () => {}
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`InsertDisabled`,`Empty`]}))();export{f as Default,m as Empty,p as InsertDisabled,h as __namedExportsOrder,u as default};