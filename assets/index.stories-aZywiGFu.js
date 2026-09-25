import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,r,t as i}from"./shorthand-row-UqPEHb3O.js";import{f as a,h as o,l as s,p as c,u as l}from"./panel-controls-DNufCMFS.js";import{n as u,t as d}from"./panel-frame-B9J5lG90.js";var f,p,m,h,g,_,v,y,b,x,S,C,w;e((()=>{o(),u(),r(),f=t(),{expect:p,fn:m,screen:h,userEvent:g}=__STORYBOOK_MODULE_TEST__,_={title:`features/editor/features/inspector/PropertyPanel/ShorthandRow`,component:n,parameters:{layout:`padded`,docs:{description:{component:`4 つの longhand を 1 行にまとめた行。

padding（畳んだ 2 欄・不揃い・辺ごと）と radius（畳んだ全幅 1 欄・不揃い・隅ごと）を
それぞれ 3 つ並べるのは、半幅セルのグリッドや全幅セルの span が崩れてもテストでは
落ちないため（happy-dom は Tailwind を解決しない）。`}}},decorators:[e=>(0,f.jsx)(d,{children:(0,f.jsx)(e,{})})],args:{onEdit:m()}},v={name:`4 辺が揃っている`,args:{shorthand:a}},y={name:`4 辺が揃っていない`,args:{shorthand:s}},b={name:`辺ごとに出したとき`,args:{shorthand:s},play:async()=>{await g.click(h.getByRole(`button`,{name:i.perLonghand.padding})),await p(h.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},x={name:`4 隅が揃っている`,args:{shorthand:c}},S={name:`4 隅が揃っていない`,args:{shorthand:l}},C={name:`隅ごとに出したとき`,args:{shorthand:l},play:async()=>{await g.click(h.getByRole(`button`,{name:i.perLonghand.radius})),await p(h.getByRole(`combobox`,{name:`Radius Top Left`})).toBeDefined()}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "4 辺が揃っている",
  args: {
    shorthand: UniformPadding
  }
}`,...v.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "4 辺が揃っていない",
  args: {
    shorthand: MixedPadding
  }
}`,...y.parameters?.docs?.source},description:{story:"揃っていないとき。どちらの辺の値を出しても食い違うので、欄は空で綴りが `不揃い` になる。",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "辺ごとに出したとき",
  args: {
    shorthand: MixedPadding
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: ShorthandLabels.perLonghand.padding
    }));
    await expect(screen.getByRole("combobox", {
      name: "Padding Top"
    })).toBeDefined();
  }
}`,...b.parameters?.docs?.source},description:{story:"セグメントの選び直しは `useState` なので、選んだ後の 2×2 は `play` を通さないと視覚差分に載らない。",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "4 隅が揃っている",
  args: {
    shorthand: UniformRadius
  }
}`,...x.parameters?.docs?.source},description:{story:`4 隅が揃っているとき。畳んだ 1 欄が行いっぱいに出る。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "4 隅が揃っていない",
  args: {
    shorthand: MixedRadius
  }
}`,...S.parameters?.docs?.source},description:{story:"揃っていないとき。どの隅の値を出しても食い違うので、欄は空で綴りが `不揃い` になる。",...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "隅ごとに出したとき",
  args: {
    shorthand: MixedRadius
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: ShorthandLabels.perLonghand.radius
    }));
    await expect(screen.getByRole("combobox", {
      name: "Radius Top Left"
    })).toBeDefined();
  }
}`,...C.parameters?.docs?.source},description:{story:"セグメントの選び直しは `useState` なので、選んだ後の 2×2 は `play` を通さないと視覚差分に載らない。",...C.parameters?.docs?.description}}},w=[`Uniform`,`Mixed`,`PerEdge`,`UniformCorners`,`MixedCorners`,`PerCorner`]}))();export{y as Mixed,S as MixedCorners,C as PerCorner,b as PerEdge,v as Uniform,x as UniformCorners,w as __namedExportsOrder,_ as default};