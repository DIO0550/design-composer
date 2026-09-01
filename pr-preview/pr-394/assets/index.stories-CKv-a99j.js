import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{a as n,r}from"./compiled-element-kKtjlNI5.js";import{n as i,t as a}from"./resize-handle-style-D6d7RYnm.js";var o,s,c,l,u;e((()=>{n(),i(),o=t(),s={title:`features/canvas/ArtboardCanvas/ResizeHandleStyle`,component:a,parameters:{layout:`fullscreen`,docs:{description:{component:`選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。

ハンドルは擬似要素なので \`<style>\` を差し込むだけで、この部品自身は何も描かない。
**当たった相手**を見るために、キャンバスの中身と同じ形（名前の属性を持つ div）を
器として敷いている。器に \`overflow-hidden\` を付けているのは artboard に揃えるため。
ハンドルを辺の外へ出す描き方に戻したら、ここで切られて視覚差分が赤くなる。

\`ArtboardCanvas\` の「artboard を選択中」でも見えるが、そちらは倍率 1 のみ。
寸法を倍率で割り戻していることは、倍率違いを並べないと確かめられない。`}}},args:{name:`home`},decorators:[e=>(0,o.jsxs)(`div`,{className:`h-56 bg-gray-100 p-8`,children:[(0,o.jsx)(`div`,{[r]:`home`,className:`h-32 w-56 overflow-hidden bg-white shadow-sm outline-2 outline-blue-500`}),(0,o.jsx)(e,{})]})]},c={name:`選択中`,args:{scale:1}},l={name:`倍率 2 倍`,args:{scale:2}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "選択中",
  args: {
    scale: 1
  }
}`,...c.parameters?.docs?.source},description:{story:"選択中の要素。掴める軸が 1 つでもあれば四隅と各辺の中間に 8 個出る\n（片方の軸しか固定していなくても出るのは UI 案の `login-form` に合わせたもの）。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "倍率 2 倍",
  args: {
    scale: 2
  }
}`,...l.parameters?.docs?.source},description:{story:`倍率を上げた状態。

寸法は倍率で割り戻すので、**中身が 2 倍に描かれてもハンドルは見た目で同じ大きさ**に
なる（当たり判定は画面上の px で当たるため）。器は倍率を掛けていないので、
ここではハンドルが半分の大きさで出るのが正しい姿。`,...l.parameters?.docs?.description}}},u=[`Selected`,`Zoomed`]}))();export{c as Selected,l as Zoomed,u as __namedExportsOrder,s as default};