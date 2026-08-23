import{n as e}from"./chunk-BneVvdWh.js";import{A as t,F as n,P as r,j as i}from"./primitive-schema-_RoYI3sQ.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{n as o,t as s}from"./token-selection-D0fRPyAg.js";import{n as c,t as l}from"./document-selection-CfaX7LLt.js";import{i as u,n as d,r as f,t as p}from"./sample-canvas-document-CFz_1B3Y.js";import{g as m,h}from"./artboard-frame-DwuvIKMP.js";import{n as g,t as _}from"./canvas-controls-B8avgLeO.js";import{n as v,t as y}from"./canvas-body-CLTmsj4o.js";function b({selection:e,compiled:n}){return(0,x.jsx)(_,{selection:e,children:r=>(0,x.jsx)(y,{compiled:n,selection:e,tokenSelection:s.create(e.document,t.none),onSelect:()=>{},...r})})}var x,S,C,w,T,E;e((()=>{c(),o(),f(),m(),i(),n(),g(),v(),x=a(),S={title:`features/canvas/ArtboardCanvas/CanvasBody`,component:b,parameters:{layout:`fullscreen`},decorators:[e=>(0,x.jsx)(`div`,{className:`h-96 w-full overflow-hidden bg-gray-100`,children:(0,x.jsx)(e,{})})]},C={name:`artboard が並ぶ`,args:{selection:u(),compiled:h.compile(d)}},w={name:`artboard が 0 枚`,args:{selection:l.fromNames(p,[]),compiled:h.compile(p)}},T={name:`コンパイルに失敗`,args:{selection:u(),compiled:r.err(Error(`参照している部品 card が見つかりません`))}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "artboard が並ぶ",
  args: {
    selection: sampleCanvasSelection(),
    compiled: DocumentHtml.compile(SampleCanvasDocument)
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "artboard が 0 枚",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    compiled: DocumentHtml.compile(EmptyCanvasDocument)
  }
}`,...w.parameters?.docs?.source},description:{story:`空表示へ倒さず知らせを出す（artboard が無いのかコンパイルが壊れたのか区別するため）。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "コンパイルに失敗",
  args: {
    selection: sampleCanvasSelection(),
    compiled: Result.err(new Error("参照している部品 card が見つかりません"))
  }
}`,...T.parameters?.docs?.source},description:{story:`コンパイルの失敗はそのまま見せる（握り潰すと原因が画面から消える）。`,...T.parameters?.docs?.description}}},E=[`Artboards`,`NoArtboards`,`CompileFailure`]}))();export{C as Artboards,T as CompileFailure,w as NoArtboards,E as __namedExportsOrder,S as default};