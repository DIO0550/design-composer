import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-6sF1Ejqi.js";import{n,t as r}from"./token-used-by-AU9yZrqy.js";import{n as i,r as a}from"./sample-token-document-Cjsn2M98.js";var o,s,c,l,u,d;e((()=>{i(),n(),o=t(),s={title:`features/tokens/TokenUsedBy`,component:r,parameters:{layout:`padded`},decorators:[e=>(0,o.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white p-3`,children:(0,o.jsx)(e,{})})]},c={name:`参照されていない`,args:{selection:a({kind:`colors`,name:`danger`})}},l={name:`上限内の件数`,args:{selection:a({kind:`colors`,name:`primary`})}},u={name:`上限を超える件数`,args:{selection:a({kind:`spacing`,name:`md`})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "参照されていない",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "danger"
    })
  }
}`,...c.parameters?.docs?.source},description:{story:"雛形の `danger` はどこからも参照されていないので 0 件になる。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "上限内の件数",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...l.parameters?.docs?.source},description:{story:"`primary` は Box の背景と `primary-button` の定義から参照されている（上限内）。",...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "上限を超える件数",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,...u.parameters?.docs?.source},description:{story:"`md` は artboard の間隔と初期部品の余白・角丸から参照されており、上限を超える。",...u.parameters?.docs?.description}}},d=[`Unused`,`WithinLimit`,`OverLimit`]}))();export{u as OverLimit,c as Unused,l as WithinLimit,d as __namedExportsOrder,s as default};