import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./token-dashed-nodes-DNYy4QW5.js";import{n as i,r as a}from"./sample-token-document-CpLL16_p.js";var o,s,c,l,u,d;e((()=>{i(),n(),o=t(),s={title:`features/tokens/TokenDashedNodes`,component:r,decorators:[e=>(0,o.jsx)(`div`,{className:`flex bg-gray-100 p-6`,children:(0,o.jsx)(e,{})})],parameters:{docs:{description:{component:`帯は灰色のキャンバス面に影付きで浮く部品なので、decorator で面と余白を与える。
白地に置くと影と角丸が沈み、実画面と違うものが視覚差分の基準になる。`}}}},c={name:`参照が1件`,args:{selection:a({kind:`colors`,name:`primary`})}},l={name:`参照が複数`,args:{selection:a({kind:`colors`,name:`gray-900`})}},u={name:`色以外のトークン`,args:{selection:a({kind:`typography`,name:`heading`})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "参照が1件",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...c.parameters?.docs?.source},description:{story:"キャンバス上で `primary` を指しているのは `home-panel` の 1 件だけ（単数形が出る）。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "参照が複数",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "gray-900"
    })
  }
}`,...l.parameters?.docs?.source},description:{story:"`gray-900` は 2 つの Text から指されている（複数形が出る）。",...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "色以外のトークン",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "heading"
    })
  }
}`,...u.parameters?.docs?.source},description:{story:"色以外は見本を持たない（`token-editor` の見出しと同じ扱い）。",...u.parameters?.docs?.description}}},d=[`Single`,`Multiple`,`NonColor`]}))();export{l as Multiple,u as NonColor,c as Single,d as __namedExportsOrder,s as default};