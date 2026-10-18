import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,r,t as i}from"./action-card-BF6r0bva.js";var a,o,s=e((()=>{r(),a={title:`書き出す`,description:`選んだ部品を画像にする`,shortcut:`⌘E`,iconPaths:[`M12 5v14`,`M19 12l-7 7-7-7`],tone:n.Normal},o={title:`取り込む`,description:`別のファイルの部品を使う`,shortcut:`⌘I`,iconPaths:[`M12 19V5`,`M5 12l7-7 7 7`],tone:n.Primary}})),c,l,u,d,f,p;e((()=>{s(),r(),c=t(),l={title:`components/ActionCard`,component:i,parameters:{layout:`padded`,docs:{description:{component:`押せるカード。配色の種類ごとと、押せないときを並べる。

\`<button>\` は幅が auto だと中身の幅に縮むので、器はグリッドにして子を横へ引き伸ばす
（開始画面も 2 列のグリッドに置いている）。194px は汎用の部品としてカードを置く代表的な幅。`}}},decorators:[e=>(0,c.jsx)(`div`,{className:`grid w-[194px]`,children:(0,c.jsx)(e,{})})],args:{content:a,onClick:()=>{},disabled:!1}},u={name:`プライマリ`,args:{content:o}},d={name:`ノーマル`},f={name:`押せない`,args:{disabled:!0}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "プライマリ",
  args: {
    content: ImportContent
  }
}`,...u.parameters?.docs?.source},description:{story:`いちばん勧めたい操作のカード。`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "ノーマル"
}`,...d.parameters?.docs?.source},description:{story:`勧め分けをしない操作のカード。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "押せない",
  args: {
    disabled: true
  }
}`,...f.parameters?.docs?.source},description:{story:`押させたくないとき。カード全体が薄くなる。`,...f.parameters?.docs?.description}}},p=[`Primary`,`Normal`,`Disabled`]}))();export{f as Disabled,d as Normal,u as Primary,p as __namedExportsOrder,l as default};