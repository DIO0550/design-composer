import{n as e}from"./chunk-BneVvdWh.js";import{a as t,r as n}from"./sample-editor-state-CzY0SxYl.js";import{n as r,t as i}from"./editor-state-DVWJl9qk.js";import{t as a}from"./jsx-runtime-ChEsXk_u.js";import{n as o,t as s}from"./token-editor-BECuuMsl.js";var c,l,u,d,f,p,m,h,g,_;e((()=>{t(),r(),o(),c=a(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/editor/TokenEditor`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,c.jsx)(e,{})})],args:{onSetTokenValue:l(),onRenameToken:l(),onRemoveToken:l()}},d={name:`選択されていない`,args:{state:n}},f={name:`色トークンを選択中`,args:{state:i.selectToken(n,{kind:`colors`,name:`primary`})}},p={name:`間隔トークンを選択中`,args:{state:i.selectToken(n,{kind:`spacing`,name:`md`})}},m={name:`影トークンを選択中`,args:{state:i.selectToken(n,{kind:`shadows`,name:`md`})}},h={name:`書体トークンを選択中`,args:{state:i.selectToken(n,{kind:`typography`,name:`body`})}},g={name:`角丸トークンを選択中`,args:{state:i.selectToken(n,{kind:`radius`,name:`md`})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
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
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "spacing",
      name: "md"
    })
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "影トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "shadows",
      name: "md"
    })
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "書体トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "typography",
      name: "body"
    })
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "角丸トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "radius",
      name: "md"
    })
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ColorSelected`,`SpacingSelected`,`ShadowSelected`,`TypographySelected`,`RadiusSelected`]}))();export{f as ColorSelected,d as Default,g as RadiusSelected,m as ShadowSelected,p as SpacingSelected,h as TypographySelected,_ as __namedExportsOrder,u as default};