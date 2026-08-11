import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-Bq3EDzMt.js";import{t as a}from"./jsx-runtime-Cw9gq7QB.js";import{n as o,t as s}from"./create-component-R427uoUg.js";var c,l,u,d,f,p,m,h;e((()=>{i(),t(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/CreateComponent`,component:s,parameters:{layout:`padded`},args:{state:n.select(r,`home-title`),onCreate:l()},decorators:[e=>(0,c.jsx)(`div`,{className:`w-62 border border-gray-300 bg-white`,children:(0,c.jsx)(e,{})})]},d={name:`ノードを選んでいる`},f={name:`インスタンスを選んでいる`,args:{state:n.select(r,`home-login`)}},p={name:`artboard を選んでいる`,args:{state:n.select(r,`home`)}},m={name:`何も選んでいない`,args:{state:r}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "ノードを選んでいる"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選んでいる",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login")
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいる",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...m.parameters?.docs?.source}}},h=[`Ready`,`InstanceSelected`,`ArtboardSelected`,`Unselected`]}))();export{p as ArtboardSelected,f as InstanceSelected,d as Ready,m as Unselected,h as __namedExportsOrder,u as default};