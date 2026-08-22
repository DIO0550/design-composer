import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{a as n,n as r,r as i,t as a}from"./sample-editor-state-BonV94ow.js";import{n as o,t as s}from"./editor-state-CsGynqsh.js";import{c,s as l}from"./artboard-frame-DuLwfrGM.js";import{i as u,n as d,r as f,t as p}from"./artboard-canvas-BfvuNSQX.js";function m(e){let t=u(),n=c({document:s.document(e.state),onMove:()=>{},onInsertAt:()=>{}});return(0,h.jsx)(p,{...e,canvasView:t,nodeDrag:n})}var h,g,_,v,y,b,x,S,C;e((()=>{n(),o(),f(),l(),d(),h=t(),{fn:g}=__STORYBOOK_MODULE_TEST__,_={title:`features/editor/ArtboardCanvas`,component:m,parameters:{layout:`fullscreen`},decorators:[e=>(0,h.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,h.jsx)(e,{})})],args:{onSelect:g(),onResize:g(),onEditProp:g()}},v={name:`選択なし`,args:{state:i}},y={name:`artboard を選択中`,args:{state:s.select(i,`settings`)}},b={name:`トークンを選択中`,args:{state:s.selectToken(i,{kind:`colors`,name:`primary`})}},x={name:`artboard がない`,args:{state:a}},S={name:`ファイルが不正（凍結中）`,args:{state:r}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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