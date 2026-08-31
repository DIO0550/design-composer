import{n as e}from"./chunk-BneVvdWh.js";import{a as t,t as n}from"./compiled-element-kKtjlNI5.js";import{n as r,t as i}from"./artboard-label-b-Edyixg.js";var a,o,s,c;e((()=>{t(),r(),a={title:`features/canvas/ArtboardCanvas/ArtboardLabel`,component:i,parameters:{layout:`centered`,docs:{description:{component:`artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。

**今見ている 1 枚かどうかの出し分けは、テストでは 1 件も落ちない**
（happy-dom は Tailwind を解決しない）。青と灰色の差を確かめる手段はこの
2 つのストーリーの視覚差分だけ。\`ArtboardCanvas\` のストーリーにも出るが、
縮んだ artboard の上に小さく載るので色の差を読み取りにくい。`}}},args:{onGrab:()=>{},artboard:{element:n.create(`login`,[],[]),width:720,height:900}}},o={name:`今見ている 1 枚`,args:{isCurrent:!0}},s={name:`他の artboard`,args:{isCurrent:!1}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "今見ている 1 枚",
  args: {
    isCurrent: true
  }
}`,...o.parameters?.docs?.source},description:{story:`今ツリーが映している 1 枚。名前だけが青く太くなる（大きさは太くしない）。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "他の artboard",
  args: {
    isCurrent: false
  }
}`,...s.parameters?.docs?.source}}},c=[`Current`,`NotCurrent`]}))();export{o as Current,s as NotCurrent,c as __namedExportsOrder,a as default};