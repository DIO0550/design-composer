import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-CTa-i89e.js";import{n as i,t as a}from"./document-selection-Ccu3rfJz.js";import{n as o,t as s}from"./token-selection-DzN0J0RD.js";import{i as c,n as l,r as u,t as d}from"./sample-canvas-document-BvisNmla.js";import{c as f,s as p}from"./use-text-edit-DcRPKyEN.js";import{i as m,n as h,r as g,t as _}from"./artboard-canvas-EtDV3QvN.js";function v(e){let t=m(),n=f({document:e.selection.document,view:t.view,onMove:()=>{},onInsertAt:()=>{},onReposition:()=>{}});return(0,y.jsx)(_,{...e,canvasView:t,nodeDrag:n})}var y,b,x,S,C,w,T,E,D;e((()=>{i(),o(),u(),g(),p(),n(),h(),y=t(),{fn:b}=__STORYBOOK_MODULE_TEST__,x={title:`features/canvas/ArtboardCanvas`,component:v,parameters:{layout:`fullscreen`},decorators:[e=>(0,y.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,y.jsx)(e,{})})],args:{tokenSelection:s.create(l,r.none),isFrozen:!1,onSelect:b(),onResize:b(),onEditProp:b(),onRepositionArtboard:b()}},S={name:`選択なし`,args:{selection:c()}},C={name:`artboard を選択中`,args:{selection:c([`settings`])}},w={name:`トークンを選択中`,args:{selection:c(),tokenSelection:s.create(l,r.some({kind:`colors`,name:`primary`}))}},T={name:`artboard がない`,args:{selection:a.fromNames(d,[]),tokenSelection:s.create(d,r.none)}},E={name:`ファイルが不正（凍結中）`,args:{selection:c([`home`]),isFrozen:!0}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...C.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    selection: sampleCanvasSelection(),
    tokenSelection: TokenSelection.create(SampleCanvasDocument, Option.some({
      kind: "colors",
      name: "primary"
    }))
  }
}`,...w.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る（#147）。

\`primary\` を選ぶのは、キャンバス上でこれを指しているのが \`overflow-wide\` の 1 件だけで、
破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    tokenSelection: TokenSelection.create(EmptyCanvasDocument, Option.none)
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正（凍結中）",
  args: {
    selection: sampleCanvasSelection(["home"]),
    isFrozen: true
  }
}`,...E.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。最後に描けた内容が斜線のスクリムの下に
残り、右上に「最後に正常だった表示」のバッジが出る。

選んだままの artboard に選択の枠は残るが、リサイズハンドルは出ない。
ハンドルを出さないのは \`inert\` の効果ではなく、キャンバスが凍結中は掴める軸を
数えないため。**この差はこのストーリーにしか映らない**（凍結していない
\`artboard を選択中\` と見比べる）。`,...E.parameters?.docs?.description}}},D=[`Default`,`Selected`,`TokenSelected`,`Empty`,`Frozen`]}))();export{S as Default,T as Empty,E as Frozen,C as Selected,w as TokenSelected,D as __namedExportsOrder,x as default};