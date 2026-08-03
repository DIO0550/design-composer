import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./editor-state-CvSO6c60.js";import{n as r,r as i}from"./sample-editor-state-RA8dP_dv.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{n as o,t as s}from"./property-panel-Uo8uxWmH.js";var c,l,u,d,f,p;e((()=>{i(),t(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/PropertyPanel`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white p-3`,children:(0,c.jsx)(e,{})})],args:{onClearSelection:l()}},d={name:`選択されていない`,args:{state:r}},f={name:`artboard を選択中`,args:{state:n.select(r,`home`)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`Selected`]}))();export{d as Default,f as Selected,p as __namedExportsOrder,u as default};