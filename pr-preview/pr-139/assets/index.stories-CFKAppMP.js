import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-aY8mLVaA.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{n as o,t as s}from"./token-editor-BEdCfjqg.js";var c,l,u,d,f,p,m;e((()=>{i(),t(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/TokenEditor`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white p-3`,children:(0,c.jsx)(e,{})})],args:{onSetTokenValue:l(),onRenameToken:l(),onRemoveToken:l()}},d={name:`選択されていない`,args:{state:r}},f={name:`色トークンを選択中`,args:{state:n.selectToken(r,{kind:`colors`,name:`primary`})}},p={name:`間隔トークンを選択中`,args:{state:n.selectToken(r,{kind:`spacing`,name:`md`})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "spacing",
      name: "md"
    })
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`ColorSelected`,`SpacingSelected`]}))();export{f as ColorSelected,d as Default,p as SpacingSelected,m as __namedExportsOrder,u as default};