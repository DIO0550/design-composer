import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./token-editor-Dybl_bzX.js";import{n as i,r as a,t as o}from"./sample-token-document-CpLL16_p.js";function s(e){return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(`div`,{className:`flex h-11 shrink-0 items-center gap-2 border-gray-300 border-b px-3`,children:(0,c.jsx)(r.Title,{selection:e.selection})}),(0,c.jsx)(`div`,{className:`min-h-0 flex-1 overflow-auto p-3`,children:(0,c.jsx)(r.Body,{...e})})]})}var c,l,u,d,f,p,m,h,g,_;e((()=>{i(),n(),c=t(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`features/tokens/TokenEditor`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,c.jsx)(e,{})})],args:{onSetTokenValue:l(),onRenameToken:l(),onRemoveToken:l()}},d={name:`選択されていない`,args:{selection:o}},f={name:`色トークンを選択中`,args:{selection:a({kind:`colors`,name:`primary`})}},p={name:`間隔トークンを選択中`,args:{selection:a({kind:`spacing`,name:`md`})}},m={name:`影トークンを選択中`,args:{selection:a({kind:`shadows`,name:`md`})}},h={name:`書体トークンを選択中`,args:{selection:a({kind:`typography`,name:`body`})}},g={name:`角丸トークンを選択中`,args:{selection:a({kind:`radius`,name:`md`})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: NoTokenSelection
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "影トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "shadows",
      name: "md"
    })
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "書体トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "body"
    })
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "角丸トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "radius",
      name: "md"
    })
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ColorSelected`,`SpacingSelected`,`ShadowSelected`,`TypographySelected`,`RadiusSelected`]}))();export{f as ColorSelected,d as Default,g as RadiusSelected,m as ShadowSelected,p as SpacingSelected,h as TypographySelected,_ as __namedExportsOrder,u as default};