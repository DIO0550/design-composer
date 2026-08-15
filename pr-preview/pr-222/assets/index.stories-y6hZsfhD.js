import{n as e}from"./chunk-BneVvdWh.js";import{a as t,n,o as r,r as i,s as a,t as o}from"./sample-editor-state-CQv0rK1_.js";import{a as s,n as c,o as l,t as u}from"./artboard-canvas-DzRM9pvr.js";import{t as d}from"./jsx-runtime-Cw9gq7QB.js";function f(e){let t=l();return(0,p.jsx)(u,{...e,canvasView:t})}var p,m,h,g,_,v,y,b,x;e((()=>{t(),a(),s(),c(),p=d(),{fn:m}=__STORYBOOK_MODULE_TEST__,h={title:`features/editor/ArtboardCanvas`,component:f,parameters:{layout:`fullscreen`},decorators:[e=>(0,p.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,p.jsx)(e,{})})],args:{onSelect:m(),onMoveNode:m(),onResize:m(),onEditProp:m()}},g={name:`選択なし`,args:{state:i}},_={name:`artboard を選択中`,args:{state:r.select(i,`settings`)}},v={name:`トークンを選択中`,args:{state:r.selectToken(i,{kind:`colors`,name:`primary`})}},y={name:`artboard がない`,args:{state:o}},b={name:`ファイルが不正（凍結中）`,args:{state:n}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,..._.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary"
    })
  }
}`,...v.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る（#147）。

\`primary\` を選ぶのは、キャンバス上でこれを指しているのが \`overflow-wide\` の 1 件だけで、
破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正（凍結中）",
  args: {
    state: FILE_INVALID_EDITOR_STATE
  }
}`,...b.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。最後に描けた内容が斜線のスクリムの下に
残り、右上に「最後に正常だった表示」のバッジが出る。

選んだままの artboard に選択の枠は残るが、掴める帯（リサイズハンドル）は出ない。
帯を出さないのは \`inert\` の効果ではなく、キャンバスが凍結中はハンドルを 1 本も
渡さないため。**この差はこのストーリーにしか映らない**（凍結していない
\`artboard を選択中\` と見比べる）。`,...b.parameters?.docs?.description}}},x=[`Default`,`Selected`,`TokenSelected`,`Empty`,`Frozen`]}))();export{g as Default,y as Empty,b as Frozen,_ as Selected,v as TokenSelected,x as __namedExportsOrder,h as default};