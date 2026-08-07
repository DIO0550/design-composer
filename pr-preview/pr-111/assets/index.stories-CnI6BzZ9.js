import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-a4yRFWio.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{n as o,t as s}from"./property-panel-DF5BC6uq.js";var c,l,u,d,f,p,m,h;e((()=>{i(),t(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/PropertyPanel`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white p-3`,children:(0,c.jsx)(e,{})})],args:{onClearSelection:l(),onEditProp:l()}},d={name:`選択されていない`,args:{state:r}},f={name:`artboard を選択中`,args:{state:n.select(r,`home`)}},p={name:`Text ノードを選択中`,args:{state:n.select(r,`home-title`)}},m={name:`インスタンスを選択中（publicProps から生成）`,args:{state:n.select(r,`home-login`)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login")
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`]}))();export{d as Default,m as InstanceSelected,f as Selected,p as TextSelected,h as __namedExportsOrder,u as default};