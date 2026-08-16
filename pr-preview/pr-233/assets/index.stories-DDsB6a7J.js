import{n as e}from"./chunk-BneVvdWh.js";import{f as t,u as n}from"./primitive-schema-Bht3XqyD.js";import{n as r,t as i}from"./design-document-CXNsDfv9.js";import{a,o,r as s,s as c}from"./sample-editor-state-sggMzdeZ.js";import{t as l}from"./jsx-runtime-Cw9gq7QB.js";import{n as u,t as d}from"./token-dashed-nodes-Cz42KyFO.js";var f,p,m,h,g,_;e((()=>{r(),t(),a(),c(),u(),f=l(),p={title:`features/editor/TokenDashedNodes`,component:d,decorators:[e=>(0,f.jsx)(`div`,{className:`flex bg-gray-100 p-6`,children:(0,f.jsx)(e,{})})],parameters:{docs:{description:{component:`帯は灰色のキャンバス面に影付きで浮く部品なので、decorator で面と余白を与える。
白地に置くと影と角丸が沈み、実画面と違うものが視覚差分の基準になる。`}}}},m={name:`参照が1件`,args:{state:o.selectToken(s,{kind:`colors`,name:`primary`})}},h={name:`参照が複数`,args:{state:o.selectToken(o.create(i.create({tokens:{...n.empty(),colors:{"gray-900":`#111827`}},artboards:[{name:`home`,width:360,height:240,children:[{name:`home-title`,type:`Text`,props:{content:`ホーム`,color:`gray-900`}},{name:`home-caption`,type:`Text`,props:{content:`説明`,color:`gray-900`}}]}]})),{kind:`colors`,name:`gray-900`})}},g={name:`色以外のトークン`,args:{state:o.selectToken(s,{kind:`typography`,name:`heading`})}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "参照が1件",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...m.parameters?.docs?.source},description:{story:"キャンバス上で `primary` を指しているのは `overflow-wide` の 1 件だけ（単数形が出る）。",...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "参照が複数",
  args: {
    state: EditorState.selectToken(EditorState.create(DesignDocument.create({
      tokens: {
        ...TokenSet.empty(),
        colors: {
          "gray-900": "#111827"
        }
      },
      artboards: [{
        name: "home",
        width: 360,
        height: 240,
        children: [{
          name: "home-title",
          type: "Text",
          props: {
            content: "ホーム",
            color: "gray-900"
          }
        }, {
          name: "home-caption",
          type: "Text",
          props: {
            content: "説明",
            color: "gray-900"
          }
        }]
      }]
    })), {
      kind: "colors",
      name: "gray-900"
    })
  }
}`,...h.parameters?.docs?.source},description:{story:"複数形が出る状態。\n\n`SampleEditorState` では作れないので専用のドキュメントを組む。あちらで同じトークンを\n2 箇所から指しているのは artboard の props（`gap` / `paddingRight`）で、artboard は\n破線の相手にならないため件数が 0 になる。",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "色以外のトークン",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "typography",
      name: "heading"
    })
  }
}`,...g.parameters?.docs?.source},description:{story:"色以外は見本を持たない（`token-editor` の見出しと同じ扱い）。",...g.parameters?.docs?.description}}},_=[`Single`,`Multiple`,`NonColor`]}))();export{h as Multiple,g as NonColor,m as Single,_ as __namedExportsOrder,p as default};