import{n as e}from"./chunk-BneVvdWh.js";import{a as t,o as n,r,s as i}from"./sample-editor-state-sggMzdeZ.js";import{t as a}from"./jsx-runtime-Cw9gq7QB.js";import{n as o,t as s}from"./token-list-Ry3w08eE.js";var c,l,u,d,f,p;e((()=>{t(),i(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/TokenList`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white`,children:(0,c.jsx)(e,{})})],args:{onSelectToken:l(),onAddToken:l()}},d={name:`colors だけが開いている`,args:{state:r}},f={name:`色トークンを選択中`,args:{state:n.selectToken(r,{kind:`colors`,name:`primary`})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "colors だけが開いている",
  args: {
    state: SampleEditorState
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`ColorSelected`]}))();export{f as ColorSelected,d as Default,p as __namedExportsOrder,u as default};