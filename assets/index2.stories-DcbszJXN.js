import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-COH3HHB_.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{n as o,t as s}from"./token-used-by-PmhGgaB8.js";var c,l,u,d,f,p;e((()=>{i(),t(),o(),c=a(),l={title:`features/editor/TokenUsedBy`,component:s,parameters:{layout:`padded`},decorators:[e=>(0,c.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white p-3`,children:(0,c.jsx)(e,{})})]},u={name:`参照されていない`,args:{state:n.selectToken(r,{kind:`colors`,name:`danger`})}},d={name:`上限内の件数`,args:{state:n.selectToken(r,{kind:`colors`,name:`primary`})}},f={name:`上限を超える件数`,args:{state:n.selectToken(r,{kind:`spacing`,name:`md`})}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "参照されていない",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "danger"
    })
  }
}`,...u.parameters?.docs?.source},description:{story:"雛形の `danger` はどこからも参照されていないので 0 件になる。",...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "上限内の件数",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...d.parameters?.docs?.source},description:{story:"`primary` は Box の背景と `primary-button` の定義から参照されている（上限内）。",...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "上限を超える件数",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "spacing",
      name: "md"
    })
  }
}`,...f.parameters?.docs?.source},description:{story:"`md` は artboard の余白・間隔と初期部品の余白から参照されており、上限を超える。",...f.parameters?.docs?.description}}},p=[`Unused`,`WithinLimit`,`OverLimit`]}))();export{f as OverLimit,u as Unused,d as WithinLimit,p as __namedExportsOrder,l as default};