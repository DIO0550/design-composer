import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./editor-state-D_lFpsXN.js";import{n as r,r as i,t as a}from"./sample-editor-state-GLP4v-cG.js";import{t as o}from"./jsx-runtime-D16BNjX-.js";import{n as s,t as c}from"./document-tree-DRa0gAYg.js";var l,u,d,f,p,m,h;e((()=>{i(),t(),s(),l=o(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`features/editor/DocumentTree`,component:c,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,l.jsx)(e,{})})],args:{onSelect:u()}},f={name:`選択なし`,args:{state:r}},p={name:`artboard を選択中`,args:{state:n.select(r,`home`)}},m={name:`artboard がない`,args:{state:a}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Selected`,`Empty`]}))();export{f as Default,m as Empty,p as Selected,h as __namedExportsOrder,d as default};