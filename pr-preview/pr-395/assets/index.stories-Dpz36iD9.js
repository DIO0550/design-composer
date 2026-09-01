import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./token-dashed-nodes-BUrtWpFn.js";import{n as i,r as a}from"./sample-token-document-NlCTKJvh.js";var o,s,c,l,u,d,f;e((()=>{i(),n(),o=t(),{fn:s}=__STORYBOOK_MODULE_TEST__,c={title:`features/tokens/TokenDashedNodes`,component:r,args:{onReveal:s()},decorators:[e=>(0,o.jsx)(`div`,{className:`flex bg-gray-100 p-6`,children:(0,o.jsx)(e,{})})],parameters:{docs:{description:{component:`帯は灰色のキャンバス面に影付きで浮く部品なので、decorator で面と余白を与える。
白地に置くと影と角丸が沈み、実画面と違うものが視覚差分の基準になる。`}}}},l={name:`参照が1件`,args:{selection:a({kind:`colors`,name:`primary`})}},u={name:`参照が複数`,args:{selection:a({kind:`colors`,name:`gray-900`})}},d={name:`色以外のトークン`,args:{selection:a({kind:`typography`,name:`heading`})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "参照が1件",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...l.parameters?.docs?.source},description:{story:"キャンバス上で `primary` を指しているのは `home-panel` の 1 件だけ（単数形が出る）。",...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "参照が複数",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "gray-900"
    })
  }
}`,...u.parameters?.docs?.source},description:{story:"`gray-900` は 2 つの Text から指されている（複数形が出る）。",...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "色以外のトークン",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "heading"
    })
  }
}`,...d.parameters?.docs?.source},description:{story:"色以外は見本を持たない（`token-editor` の見出しと同じ扱い）。",...d.parameters?.docs?.description}}},f=[`Single`,`Multiple`,`NonColor`]}))();export{u as Multiple,d as NonColor,l as Single,f as __namedExportsOrder,c as default};