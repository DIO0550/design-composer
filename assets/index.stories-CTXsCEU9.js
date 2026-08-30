import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-BPcpmR5m.js";import{n as i,t as a}from"./pane-body-BQ1c7VA_.js";import{n as o,t as s}from"./pane-heading-CQ-2jmhx.js";import{n as c,t as l}from"./token-editor-D2KV5Vna.js";import{n as u,r as d,t as f}from"./sample-token-document-COWwVgSS.js";function p(e){return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(s,{children:(0,m.jsx)(l.Title,{selection:e.selection})}),(0,m.jsx)(a,{children:(0,m.jsx)(l.Body,{...e})})]})}var m,h,g,_,v,y,b,x,S,C;e((()=>{n(),i(),o(),u(),c(),m=t(),{fn:h}=__STORYBOOK_MODULE_TEST__,g={title:`features/tokens/TokenEditor`,component:p,parameters:{layout:`padded`},decorators:[e=>(0,m.jsx)(r,{height:`pane`,children:(0,m.jsx)(e,{})})],args:{onSetTokenValue:h(),onRenameToken:h(),onRemoveToken:h()}},_={name:`選択されていない`,args:{selection:f}},v={name:`色トークンを選択中`,args:{selection:d({kind:`colors`,name:`primary`})}},y={name:`間隔トークンを選択中`,args:{selection:d({kind:`spacing`,name:`md`})}},b={name:`影トークンを選択中`,args:{selection:d({kind:`shadows`,name:`md`})}},x={name:`書体トークンを選択中`,args:{selection:d({kind:`typography`,name:`body`})}},S={name:`角丸トークンを選択中`,args:{selection:d({kind:`radius`,name:`md`})}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: NoTokenSelection
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "影トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "shadows",
      name: "md"
    })
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "書体トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "body"
    })
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "角丸トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "radius",
      name: "md"
    })
  }
}`,...S.parameters?.docs?.source}}},C=[`Default`,`ColorSelected`,`SpacingSelected`,`ShadowSelected`,`TypographySelected`,`RadiusSelected`]}))();export{v as ColorSelected,_ as Default,S as RadiusSelected,b as ShadowSelected,y as SpacingSelected,x as TypographySelected,C as __namedExportsOrder,g as default};