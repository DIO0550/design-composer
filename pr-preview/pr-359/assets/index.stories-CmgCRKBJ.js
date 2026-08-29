import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-BPcpmR5m.js";import{n as i,t as a}from"./pane-body-BnHUDQ4l.js";import{n as o,t as s}from"./token-used-by-ZN2WnKkD.js";import{n as c,r as l}from"./sample-token-document-TUGQKSOG.js";var u,d,f,p,m,h;e((()=>{n(),i(),c(),o(),u=t(),d={title:`features/tokens/TokenUsedBy`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,u.jsx)(r,{height:`content`,children:(0,u.jsx)(a,{children:(0,u.jsx)(e,{})})})]},f={name:`参照されていない`,args:{selection:l({kind:`colors`,name:`danger`})}},p={name:`上限内の件数`,args:{selection:l({kind:`colors`,name:`primary`})}},m={name:`上限を超える件数`,args:{selection:l({kind:`spacing`,name:`md`})}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "参照されていない",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "danger"
    })
  }
}`,...f.parameters?.docs?.source},description:{story:"雛形の `danger` はどこからも参照されていないので 0 件になる。",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "上限内の件数",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...p.parameters?.docs?.source},description:{story:"`primary` は Box の背景と `primary-button` の定義から参照されている（上限内）。",...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "上限を超える件数",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,...m.parameters?.docs?.source},description:{story:"`md` は artboard の間隔と初期部品の余白・角丸から参照されており、上限を超える。",...m.parameters?.docs?.description}}},h=[`Unused`,`WithinLimit`,`OverLimit`]}))();export{m as OverLimit,f as Unused,p as WithinLimit,h as __namedExportsOrder,d as default};