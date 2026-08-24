import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./pane-body-DA_USLG7.js";import{n as i,t as a}from"./pane-heading-CMKY7S1-.js";import{n as o,t as s}from"./token-editor-CjnNKKbw.js";import{n as c,r as l,t as u}from"./sample-token-document-D8PSqwvA.js";function d(e){return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(a,{children:(0,f.jsx)(s.Title,{selection:e.selection})}),(0,f.jsx)(r,{children:(0,f.jsx)(s.Body,{...e})})]})}var f,p,m,h,g,_,v,y,b,x;e((()=>{n(),i(),c(),o(),f=t(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/tokens/TokenEditor`,component:d,parameters:{layout:`padded`},decorators:[e=>(0,f.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,f.jsx)(e,{})})],args:{onSetTokenValue:p(),onRenameToken:p(),onRemoveToken:p()}},h={name:`選択されていない`,args:{selection:u}},g={name:`色トークンを選択中`,args:{selection:l({kind:`colors`,name:`primary`})}},_={name:`間隔トークンを選択中`,args:{selection:l({kind:`spacing`,name:`md`})}},v={name:`影トークンを選択中`,args:{selection:l({kind:`shadows`,name:`md`})}},y={name:`書体トークンを選択中`,args:{selection:l({kind:`typography`,name:`body`})}},b={name:`角丸トークンを選択中`,args:{selection:l({kind:`radius`,name:`md`})}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: NoTokenSelection
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "影トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "shadows",
      name: "md"
    })
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "書体トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "body"
    })
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "角丸トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "radius",
      name: "md"
    })
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`ColorSelected`,`SpacingSelected`,`ShadowSelected`,`TypographySelected`,`RadiusSelected`]}))();export{g as ColorSelected,h as Default,b as RadiusSelected,v as ShadowSelected,_ as SpacingSelected,y as TypographySelected,x as __namedExportsOrder,m as default};