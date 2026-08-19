import{n as e}from"./chunk-BneVvdWh.js";import{M as t,j as n}from"./primitive-schema-Ke4zSQuu.js";import{t as r}from"./jsx-runtime-ChEsXk_u.js";import{n as i,t as a}from"./node-insert-toolbar-X12IPi-U.js";var o,s,c,l,u,d;e((()=>{t(),i(),o=r(),s={title:`features/editor/NodeInsertToolbar`,component:a,parameters:{layout:`fullscreen`},args:{onInsert:()=>{},dragged:n.none},decorators:[e=>(0,o.jsx)(`div`,{className:`relative h-64 w-full bg-gray-100`,children:(0,o.jsx)(`div`,{className:`absolute inset-x-0 bottom-4 flex justify-center`,children:(0,o.jsx)(e,{})})})]},c={name:`挿せる位置がある`,args:{isInsertEnabled:!0}},l={name:`何も選んでいない`,args:{isInsertEnabled:!1}},u={name:`部品を運んでいる`,args:{isInsertEnabled:!0,dragged:n.some({kind:`instance`,componentName:`primary-button`})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "挿せる位置がある",
  args: {
    isInsertEnabled: true
  }
}`,...c.parameters?.docs?.source},description:{story:`子を持てるもの（artboard / Box）を選んでいる状態。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    isInsertEnabled: false
  }
}`,...l.parameters?.docs?.source},description:{story:`何も選んでいない状態。挿入先が決まらないので押せない。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "部品を運んでいる",
  args: {
    isInsertEnabled: true,
    dragged: Option.some<NodeTemplate>({
      kind: "instance",
      componentName: "primary-button"
    })
  }
}`,...u.parameters?.docs?.source},description:{story:"パレットから部品を運んでいる状態（UI 案 docs/Design Composer.html の `3a · ASSETS`。\n`◆` に `background:#f3ebff` が付く）。\n\n**点灯は Tailwind の class でしか表れず、テストでは見えない。**\n素の `◆` との差を確かめる手段はこのストーリーの視覚差分だけ。",...u.parameters?.docs?.description}}},d=[`InsertEnabled`,`NoSelection`,`PlacingInstance`]}))();export{c as InsertEnabled,l as NoSelection,u as PlacingInstance,d as __namedExportsOrder,s as default};