import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{a as n,r}from"./compiled-element-CqrySFwv.js";import{n as i,t as a}from"./name-style-rule-CkmALZuO.js";var o,s,c,l,u,d;e((()=>{n(),i(),o=t(),s={title:`features/canvas/ArtboardCanvas/NameStyleRule`,component:a,parameters:{layout:`fullscreen`,docs:{description:{component:`名前で指した要素だけに効く規則。

規則そのものは \`<style>\` なので何も描かれない。**規則が当たった相手**を見るために、
キャンバスの中身と同じ形（名前の属性を持つ div）を器として敷いている。
名前を 2 つ並べるのは、**指した 1 つにだけ当たる**ことがこの部品の要だから。`}}},decorators:[e=>(0,o.jsxs)(`div`,{className:`flex h-48 items-start gap-8 bg-gray-100 p-8`,children:[(0,o.jsx)(`div`,{[r]:`home-title`,className:`h-20 w-40 bg-white`}),(0,o.jsx)(`div`,{[r]:`home-note`,className:`h-20 w-40 bg-white`}),(0,o.jsx)(e,{})]})]},c={name:`選択の枠`,args:{name:`home-title`,declarations:`outline:2px solid #3b82f6;outline-offset:1px`}},l={name:`ドロップ先の枠`,args:{name:`home-title`,declarations:`outline:2px dashed #10b981;outline-offset:1px`}},u={name:`トークンの参照元の破線`,args:{name:`home-title`,declarations:`outline:1.5px dashed #0d99ff;outline-offset:2px`}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "選択の枠",
  args: {
    name: "home-title",
    declarations: "outline:2px solid #3b82f6;outline-offset:1px"
  }
}`,...c.parameters?.docs?.source},description:{story:"選択の枠（`artboard-frame-list` の `SelectionOutline` と同じ綴り）。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "ドロップ先の枠",
  args: {
    name: "home-title",
    declarations: "outline:2px dashed #10b981;outline-offset:1px"
  }
}`,...l.parameters?.docs?.source},description:{story:`ドロップ先の枠。選択と同時に出るので、破線と色で見分けられる必要がある。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "トークンの参照元の破線",
  args: {
    name: "home-title",
    declarations: "outline:1.5px dashed #0d99ff;outline-offset:2px"
  }
}`,...u.parameters?.docs?.source},description:{story:`トークンの参照元に掛かる破線（UI 案の Tokens 画面）。`,...u.parameters?.docs?.description}}},d=[`Selection`,`DropParent`,`TokenReferrer`]}))();export{l as DropParent,c as Selection,u as TokenReferrer,d as __namedExportsOrder,s as default};