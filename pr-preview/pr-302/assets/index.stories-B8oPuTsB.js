import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-Bq002N32.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{n as i,t as a}from"./token-selection-C8SAtlti.js";import{i as o,r as s}from"./sample-canvas-document-BrBX7fYi.js";import{g as c,h as l}from"./artboard-frame-DFD7nioT.js";import{n as u,t as d}from"./canvas-controls-c45VqU5S.js";import{n as f,t as p}from"./artboard-frame-list-xnNDoxE8.js";function m({selection:e}){let t=l.compile(e.document);return t.ok?(0,h.jsx)(d,{selection:e,children:r=>(0,h.jsx)(p,{compiled:t.value,selection:e,tokenSelection:a.create(e.document,n.none),onSelect:()=>{},...r})}):(0,h.jsxs)(`p`,{children:[`コンパイルに失敗しました: `,t.error.message]})}var h,g,_,v,y,b;e((()=>{i(),s(),c(),t(),u(),f(),h=r(),g={title:`features/canvas/ArtboardCanvas/ArtboardFrameList`,component:m,parameters:{layout:`fullscreen`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-[32rem] w-full overflow-auto bg-gray-100`,children:(0,h.jsx)(e,{})})]},_={name:`選択なし`,args:{selection:o()}},v={name:`artboard を選択中`,args:{selection:o([`settings`])}},y={name:`配下のノードを選択中`,args:{selection:o([`overflow-wide`])}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...v.parameters?.docs?.source},description:{story:`選択の枠（青の実線）。artboard 自身を選ぶと枠ごと囲まれる。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "配下のノードを選択中",
  args: {
    selection: sampleCanvasSelection(["overflow-wide"])
  }
}`,...y.parameters?.docs?.source},description:{story:`配下のノードを選んだ状態。

枠は選んだノードに付き、見出しの青は**それを載せている artboard**に付く
（\`aria-current\` と同じ「今見ている 1 枚」の意味 / #184）。2 つが別のものを
指していることは、この組み合わせでしか見えない。`,...y.parameters?.docs?.description}}},b=[`Default`,`ArtboardSelected`,`NodeSelected`]}))();export{v as ArtboardSelected,_ as Default,y as NodeSelected,b as __namedExportsOrder,g as default};