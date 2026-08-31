import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,r,t as i}from"./shorthand-row-D4ivG3PY.js";import{d as a,l as o,p as s}from"./panel-controls-BWqOE_dO.js";import{n as c,t as l}from"./panel-frame-DOyYf8uC.js";var u,d,f,p,m,h,g,_,v,y;e((()=>{s(),c(),r(),u=t(),{expect:d,fn:f,screen:p,userEvent:m}=__STORYBOOK_MODULE_TEST__,h={title:`features/inspector/PropertyPanel/ShorthandRow`,component:n,parameters:{layout:`padded`,docs:{description:{component:`4 辺を 1 行にまとめた行。

畳んだ 2 欄・不揃い・辺ごとの 3 つを並べるのは、半幅セルのグリッドが崩れても
テストでは落ちないため（happy-dom は Tailwind を解決しない）。`}}},decorators:[e=>(0,u.jsx)(l,{children:(0,u.jsx)(e,{})})],args:{onEdit:f()}},g={name:`4 辺が揃っている`,args:{shorthand:a}},_={name:`4 辺が揃っていない`,args:{shorthand:o}},v={name:`辺ごとに出したとき`,args:{shorthand:o},play:async()=>{await m.click(p.getByRole(`button`,{name:i.perEdge})),await d(p.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "4 辺が揃っている",
  args: {
    shorthand: UniformPadding
  }
}`,...g.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "4 辺が揃っていない",
  args: {
    shorthand: MixedPadding
  }
}`,..._.parameters?.docs?.source},description:{story:"揃っていないとき。どちらの辺の値を出しても食い違うので、欄は空で綴りが `不揃い` になる。",..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "辺ごとに出したとき",
  args: {
    shorthand: MixedPadding
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: ShorthandLabels.perEdge
    }));
    await expect(screen.getByRole("combobox", {
      name: "Padding Top"
    })).toBeDefined();
  }
}`,...v.parameters?.docs?.source},description:{story:"切り替えは `useState` なので、押した後の 2×2 は `play` を通さないと視覚差分に載らない。",...v.parameters?.docs?.description}}},y=[`Uniform`,`Mixed`,`PerEdge`]}))();export{_ as Mixed,v as PerEdge,g as Uniform,y as __namedExportsOrder,h as default};