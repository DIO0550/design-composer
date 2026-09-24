import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CilqoLzs.js";import{n as r,t as i}from"./Option-CPpfsGoD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{n as o,r as s,t as c}from"./design-document-z6bYdyjF.js";import{n as l,t as u}from"./document-selection-DzC9GarW.js";import{n as d,t as f}from"./token-selection-UsixQSCD.js";import{i as p,r as m}from"./use-node-drag-DWH47Ag9.js";import{r as h,t as g}from"./artboard-frame-list-D3B0YGaE.js";import{i as _,r as v}from"./sample-canvas-document-Dos_Lyes.js";import{n as y,t as b}from"./canvas-controls-CuWKzFUU.js";function x({selection:e}){let t=m.compile(e.document);return n.isOk(t)?(0,S.jsx)(b,{selection:e,children:n=>(0,S.jsx)(g,{compiled:t.value,selection:e,tokenSelection:f.create(e.document,i.none),onSelect:()=>{},onContextMenu:()=>{},...n})}):(0,S.jsxs)(`p`,{children:[`コンパイルに失敗しました: `,t.error.message]})}var S,C,w,T,E,D,O;e((()=>{o(),l(),d(),v(),p(),r(),t(),y(),h(),S=a(),C={title:`features/editor/features/canvas/ArtboardCanvas/ArtboardFrameList`,component:x,parameters:{layout:`fullscreen`},decorators:[e=>(0,S.jsx)(`div`,{className:`h-[32rem] w-full overflow-auto bg-gray-100`,children:(0,S.jsx)(e,{})})]},w={name:`選択なし`,args:{selection:_()}},T={name:`artboard を選択中`,args:{selection:_([`settings`])}},E={name:`配下のノードを選択中`,args:{selection:_([`overflow-wide`])}},D={name:`キャンバス上の座標を持つ artboard`,args:{selection:u.fromNames(c.create({tokens:s.Default.tokens,components:s.Default.components,artboards:[{name:`first`,width:200,height:140,children:[]},{name:`placed`,width:200,height:140,canvasPosition:{x:620,y:220},children:[]},{name:`second`,width:200,height:140,children:[]}]}),[])}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...T.parameters?.docs?.source},description:{story:`選択の枠（青の実線）。artboard 自身を選ぶと枠ごと囲まれる。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "配下のノードを選択中",
  args: {
    selection: sampleCanvasSelection(["overflow-wide"])
  }
}`,...E.parameters?.docs?.source},description:{story:`配下のノードを選んだ状態。

枠は選んだノードに付き、見出しの青は**それを載せている artboard**に付く（\`aria-current\`
と同じ「今見ている 1 枚」の意味）。2 つが別のものを指していることは、この組み合わせでし
か見えない。`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "キャンバス上の座標を持つ artboard",
  args: {
    selection: DocumentSelection.fromNames(DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [{
        name: "first",
        width: 200,
        height: 140,
        children: []
      }, {
        name: "placed",
        width: 200,
        height: 140,
        canvasPosition: {
          x: 620,
          y: 220
        },
        children: []
      }, {
        name: "second",
        width: 200,
        height: 140,
        children: []
      }]
    }), [])
  }
}`,...D.parameters?.docs?.source},description:{story:"ファイルにキャンバス上の座標を持つ artboard（docs/01「artboards」の `x` / `y`）。\n\n3 枚のうち `placed` だけが座標を持つ。**1 枚を離れた位置へ動かしても、残りの 2 枚は元の\n位置から動かない**ことがここで見える（既定の位置は配列順と幅だけで決まり、座標を持つ 1\n枚もその枠を空けない）。",...D.parameters?.docs?.description}}},O=[`Default`,`ArtboardSelected`,`NodeSelected`,`WithCanvasPosition`]}))();export{T as ArtboardSelected,w as Default,E as NodeSelected,D as WithCanvasPosition,O as __namedExportsOrder,C as default};