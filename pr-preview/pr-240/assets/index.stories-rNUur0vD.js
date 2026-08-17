import{n as e}from"./chunk-BneVvdWh.js";import{a as t,n,o as r,r as i,s as a,t as o}from"./sample-editor-state-60TsMZsV.js";import{d as s,f as c,i as l,n as u,r as d,t as f}from"./artboard-canvas-BNLOGpqh.js";import{t as p}from"./jsx-runtime-Cw9gq7QB.js";function m(e){let t=c(),n=l({document:r.document(e.state),onMove:()=>{},onInsertAt:()=>{}});return(0,h.jsx)(f,{...e,canvasView:t,nodeDrag:n})}var h,g,_,v,y,b,x,S,C;e((()=>{t(),a(),s(),d(),u(),h=p(),{fn:g}=__STORYBOOK_MODULE_TEST__,_={title:`features/editor/ArtboardCanvas`,component:m,parameters:{layout:`fullscreen`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,h.jsx)(e,{})})],args:{onSelect:g(),onResize:g(),onEditProp:g()}},v={name:`選択なし`,args:{state:i}},y={name:`artboard を選択中`,args:{state:r.select(i,`settings`)}},b={name:`トークンを選択中`,args:{state:r.selectToken(i,{kind:`colors`,name:`primary`})}},x={name:`artboard がない`,args:{state:o}},S={name:`ファイルが不正（凍結中）`,args:{state:n}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SampleEditorState
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SampleEditorState, "settings")
  }
}`,...y.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...b.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る（#147）。

\`primary\` を選ぶのは、キャンバス上でこれを指しているのが \`overflow-wide\` の 1 件だけで、
破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EmptyEditorState
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正（凍結中）",
  args: {
    state: FileInvalidEditorState
  }
}`,...S.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。最後に描けた内容が斜線のスクリムの下に
残り、右上に「最後に正常だった表示」のバッジが出る。

選んだままの artboard に選択の枠は残るが、掴める帯（リサイズハンドル）は出ない。
帯を出さないのは \`inert\` の効果ではなく、キャンバスが凍結中はハンドルを 1 本も
渡さないため。**この差はこのストーリーにしか映らない**（凍結していない
\`artboard を選択中\` と見比べる）。`,...S.parameters?.docs?.description}}},C=[`Default`,`Selected`,`TokenSelected`,`Empty`,`Frozen`]}))();export{v as Default,x as Empty,S as Frozen,y as Selected,b as TokenSelected,C as __namedExportsOrder,_ as default};