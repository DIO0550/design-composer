import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-CTa-i89e.js";import{n as i,r as a,t as o}from"./design-document-CBqWt_a8.js";import{n as s,t as c}from"./document-selection-H11tHSps.js";import{n as l,t as u}from"./token-selection-DnFFvTAl.js";import{i as d,r as f}from"./sample-canvas-document-Di_cKu6a.js";import{m as p,p as m}from"./use-text-edit-C093neg8.js";import{n as h,t as g}from"./canvas-controls-D5k2lsSH.js";import{r as _,t as v}from"./artboard-frame-list-BLD373qS.js";function y({selection:e}){let t=m.compile(e.document);return t.ok?(0,b.jsx)(g,{selection:e,children:n=>(0,b.jsx)(v,{compiled:t.value,selection:e,tokenSelection:u.create(e.document,r.none),onSelect:()=>{},...n})}):(0,b.jsxs)(`p`,{children:[`コンパイルに失敗しました: `,t.error.message]})}var b,x,S,C,w,T,E;e((()=>{i(),s(),l(),f(),p(),n(),h(),_(),b=t(),x={title:`features/canvas/ArtboardCanvas/ArtboardFrameList`,component:y,parameters:{layout:`fullscreen`},decorators:[e=>(0,b.jsx)(`div`,{className:`h-[32rem] w-full overflow-auto bg-gray-100`,children:(0,b.jsx)(e,{})})]},S={name:`選択なし`,args:{selection:d()}},C={name:`artboard を選択中`,args:{selection:d([`settings`])}},w={name:`配下のノードを選択中`,args:{selection:d([`overflow-wide`])}},T={name:`キャンバス上の座標を持つ artboard`,args:{selection:c.fromNames(o.create({tokens:a.Default.tokens,components:a.Default.components,artboards:[{name:`first`,width:200,height:140,children:[]},{name:`placed`,width:200,height:140,canvasPosition:{x:620,y:220},children:[]},{name:`second`,width:200,height:140,children:[]}]}),[])}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...C.parameters?.docs?.source},description:{story:`選択の枠（青の実線）。artboard 自身を選ぶと枠ごと囲まれる。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "配下のノードを選択中",
  args: {
    selection: sampleCanvasSelection(["overflow-wide"])
  }
}`,...w.parameters?.docs?.source},description:{story:`配下のノードを選んだ状態。

枠は選んだノードに付き、見出しの青は**それを載せている artboard**に付く
（\`aria-current\` と同じ「今見ている 1 枚」の意味 / #184）。2 つが別のものを
指していることは、この組み合わせでしか見えない。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source},description:{story:"ファイルにキャンバス上の座標を持つ artboard（docs/01「artboards」の `x` / `y`）。\n\n3 枚のうち `placed` だけが座標を持つ。**1 枚を離れた位置へ動かしても、残りの 2 枚は\n元の位置から動かない**ことがここで見える（既定の位置は配列順と幅だけで決まり、\n座標を持つ 1 枚もその枠を空けない）。`placed` が抜けた真ん中が空くのはそのため。\n並びだけを映す `ArtboardFrameList` に置くのは、`ArtboardCanvas` のストーリーだと\n倍率・パンの器ごと撮るため。",...T.parameters?.docs?.description}}},E=[`Default`,`ArtboardSelected`,`NodeSelected`,`WithCanvasPosition`]}))();export{C as ArtboardSelected,S as Default,w as NodeSelected,T as WithCanvasPosition,E as __namedExportsOrder,x as default};