import{n as e}from"./chunk-BneVvdWh.js";import{F as t,I as n}from"./primitive-schema-Ke4zSQuu.js";import{a as r,r as i,t as a}from"./sample-editor-state-B3W5dnKl.js";import{n as o,t as s}from"./editor-state-5rGpErim.js";import{g as c,h as l}from"./artboard-frame-j_LwdBCw.js";import{n as u,t as d}from"./canvas-controls-boqXyTht.js";import{t as f}from"./jsx-runtime-ChEsXk_u.js";import{n as p,t as m}from"./canvas-body-BtEJ78dc.js";function h({state:e,compiled:t}){return(0,g.jsx)(d,{state:e,children:n=>(0,g.jsx)(m,{compiled:t,state:e,onSelect:()=>{},...n})})}var g,_,v,y,b,x;e((()=>{r(),o(),c(),n(),u(),p(),g=f(),_={title:`features/editor/ArtboardCanvas/CanvasBody`,component:h,parameters:{layout:`fullscreen`},decorators:[e=>(0,g.jsx)(`div`,{className:`h-96 w-full overflow-hidden bg-gray-100`,children:(0,g.jsx)(e,{})})]},v={name:`artboard が並ぶ`,args:{state:i,compiled:l.compile(s.document(i))}},y={name:`artboard が 0 枚`,args:{state:a,compiled:l.compile(s.document(a))}},b={name:`コンパイルに失敗`,args:{state:i,compiled:t.err(Error(`参照している部品 card が見つかりません`))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard が並ぶ",
  args: {
    state: SampleEditorState,
    compiled: DocumentHtml.compile(EditorState.document(SampleEditorState))
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "artboard が 0 枚",
  args: {
    state: EmptyEditorState,
    compiled: DocumentHtml.compile(EditorState.document(EmptyEditorState))
  }
}`,...y.parameters?.docs?.source},description:{story:`空表示へ倒さず知らせを出す（artboard が無いのかコンパイルが壊れたのか区別するため）。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "コンパイルに失敗",
  args: {
    state: SampleEditorState,
    compiled: Result.err(new Error("参照している部品 card が見つかりません"))
  }
}`,...b.parameters?.docs?.source},description:{story:`コンパイルの失敗はそのまま見せる（握り潰すと原因が画面から消える）。`,...b.parameters?.docs?.description}}},x=[`Artboards`,`NoArtboards`,`CompileFailure`]}))();export{v as Artboards,b as CompileFailure,y as NoArtboards,x as __namedExportsOrder,_ as default};