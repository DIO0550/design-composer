import{n as e}from"./chunk-BneVvdWh.js";import{a as t,r as n}from"./sample-editor-state-DuIDV25x.js";import{n as r,t as i}from"./editor-state-3cICpLSW.js";import{t as a}from"./jsx-runtime-ChEsXk_u.js";import{n as o,t as s}from"./token-list-DLDSifq1.js";var c,l,u,d,f,p;e((()=>{t(),r(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/TokenList`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white`,children:(0,c.jsx)(e,{})})],args:{onSelectToken:l(),onAddToken:l()}},d={name:`colors だけが開いている`,args:{state:n}},f={name:`色トークンを選択中`,args:{state:i.selectToken(n,{kind:`colors`,name:`primary`})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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