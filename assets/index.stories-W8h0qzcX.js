import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CilqoLzs.js";import{n as r,t as i}from"./Option-CPpfsGoD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{n as o,t as s}from"./document-selection-BXeOyKSJ.js";import{n as c,t as l}from"./token-selection-BKWuvZ3W.js";import{i as u,r as d}from"./use-node-drag-CmahtIW8.js";import{n as f,t as p}from"./canvas-body-BISCxDB2.js";import{i as m,n as h,r as g,t as _}from"./sample-canvas-document-D6PYxlZG.js";import{n as v,t as y}from"./canvas-controls-TvaXX3T3.js";function b({selection:e,compiled:t}){return(0,x.jsx)(y,{selection:e,children:n=>(0,x.jsx)(p,{compiled:t,selection:e,tokenSelection:l.create(e.document,i.none),onSelect:()=>{},onContextMenu:()=>{},...n})})}var x,S,C,w,T,E;e((()=>{o(),c(),g(),u(),r(),t(),v(),f(),x=a(),S={title:`features/editor/features/canvas/ArtboardCanvas/CanvasBody`,component:b,parameters:{layout:`fullscreen`},decorators:[e=>(0,x.jsx)(`div`,{className:`h-96 w-full overflow-hidden bg-gray-100`,children:(0,x.jsx)(e,{})})]},C={name:`artboard が並ぶ`,args:{selection:m(),compiled:d.compile(h)}},w={name:`artboard が 0 枚`,args:{selection:s.fromNames(_,[]),compiled:d.compile(_)}},T={name:`コンパイルに失敗`,args:{selection:m(),compiled:n.err(Error(`参照している部品 card が見つかりません`))}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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