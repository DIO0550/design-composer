import{n as e}from"./chunk-BneVvdWh.js";import{m as t,p as n}from"./rotation-DKrr6ELo.js";import{o as r,t as i}from"./compiled-element-BvJgNAfs.js";import{n as a,t as o}from"./artboard-label-tzYZgl-M.js";var s,c,l,u;e((()=>{r(),t(),a(),s={title:`features/editor/features/canvas/ArtboardCanvas/ArtboardLabel`,component:o,parameters:{layout:`centered`,docs:{description:{component:`artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。

**今見ている 1 枚かどうかの出し分けは、テストでは 1 件も落ちない**
（happy-dom は Tailwind を解決しない）。青と灰色の差を確かめる手段はこの
2 つのストーリーの視覚差分だけ。\`ArtboardCanvas\` のストーリーにも出るが、
縮んだ artboard の上に小さく載るので色の差を読み取りにくい。`}}},args:{onGrab:()=>{},artboard:{element:i.create(`login`,[],[]),width:720,height:900,visibility:n.Default}}},c={name:`今見ている 1 枚`,args:{isCurrent:!0}},l={name:`他の artboard`,args:{isCurrent:!1}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "今見ている 1 枚",
  args: {
    isCurrent: true
  }
}`,...c.parameters?.docs?.source},description:{story:`今ツリーが映している 1 枚。名前だけが青く太くなる（大きさは太くしない）。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "他の artboard",
  args: {
    isCurrent: false
  }
}`,...l.parameters?.docs?.source}}},u=[`Current`,`NotCurrent`]}))();export{c as Current,l as NotCurrent,u as __namedExportsOrder,s as default};