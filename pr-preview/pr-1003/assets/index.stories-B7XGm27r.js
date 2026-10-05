import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{H as i,z as a}from"./placement-sPwaWLbf.js";import{n as o,t as s}from"./design-document-RtnSlOex.js";import{n as c,t as l}from"./document-selection-CibSZbc0.js";import{n as u,t as d}from"./token-selection-DRBsH5Rc.js";import{n as f,t as p}from"./use-node-drag-DZzHYPyW.js";import{i as m,n as h,r as g,t as _}from"./use-canvas-view-DQffs1i5.js";import{i as v,n as y,r as b,t as x}from"./sample-canvas-document-B4lZEQmj.js";function S(e){let t=h(),n=f({selection:e.selection,view:t.view,onMove:()=>{},onInsertAt:()=>{},onReposition:()=>{}});return(0,C.jsx)(g,{...e,canvasView:t,nodeDrag:n})}var C,w,T,E,D,O,k,A,j,M,N,P,F,I,L;e((()=>{o(),i(),c(),u(),b(),_(),p(),t(),m(),C=r(),{fn:w}=__STORYBOOK_MODULE_TEST__,T={title:`features/editor/features/canvas/ArtboardCanvas`,component:S,parameters:{layout:`fullscreen`},decorators:[e=>(0,C.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,C.jsx)(e,{})})],args:{tokenSelection:d.create(y,n.none),isFrozen:!1,onSelect:w(),onSelectInRange:w(),onResize:w(),onEditProp:w(),onRepositionArtboard:w(),onOpenContextMenu:w()}},E={name:`選択なし`,args:{selection:v()}},D={name:`artboard を選択中`,args:{selection:v([`settings`])}},O={name:`トークンを選択中`,args:{selection:v(),tokenSelection:d.create(y,n.some({kind:`colors`,name:`primary`}))}},k=s.create({tokens:y.tokens,components:y.components,artboards:y.artboards.map(e=>e.name===`settings`?{...e,props:{...e.props,visibility:`hidden`}}:e)}),A={name:`非表示の artboard を選択中`,args:{selection:l.fromNames(k,[`settings`]),tokenSelection:d.create(k,n.none)}},j=s.create({tokens:y.tokens,components:y.components,artboards:y.artboards.map(e=>({...e,children:e.children.map(e=>e.name===`home-banner`&&a.isPrimitive(e)?{...e,props:{...e.props,visibility:`hidden`}}:e)}))}),M={name:`非表示のノードを選択中`,args:{selection:l.fromNames(j,[`home-banner`]),tokenSelection:d.create(j,n.none)}},N=s.create({tokens:y.tokens,artboards:[{name:`shapes`,width:320,height:200,props:{layout:`row`,gap:`md`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`dot`,type:`Ellipse`},{name:`oval`,type:`Ellipse`,props:{width:140,height:72,background:`brand`}}]}]}),P={name:`Ellipse を選択中`,args:{selection:l.fromNames(N,[`oval`]),tokenSelection:d.create(N,n.none)}},F={name:`artboard がない`,args:{selection:l.fromNames(x,[]),tokenSelection:d.create(x,n.none)}},I={name:`ファイルが不正（凍結中）`,args:{selection:v([`home`]),isFrozen:!0}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...D.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    selection: sampleCanvasSelection(),
    tokenSelection: TokenSelection.create(SampleCanvasDocument, Option.some({
      kind: "colors",
      name: "primary"
    }))
  }
}`,...O.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,...O.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "非表示の artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(HiddenSettingsDocument, ["settings"]),
    tokenSelection: TokenSelection.create(HiddenSettingsDocument, Option.none)
  }
}`,...A.parameters?.docs?.source},description:{story:`非表示の artboard は、選んでいても枠・見出し・リサイズハンドルごと描かれない
（docs/06-ui.md「非表示の artboard」）。後ろの自動配置の artboard は隠す前と同じ位置に残る
（\`選択なし\` と見比べる）。`,...A.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "非表示のノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(HiddenBannerDocument, ["home-banner"]),
    tokenSelection: TokenSelection.create(HiddenBannerDocument, Option.none)
  }
}`,...M.parameters?.docs?.source},description:{story:`非表示のノードは、ツリーから選んでいても枠もリサイズハンドルも描かれない
（docs/06-ui.md「リサイズハンドル」）。`,...M.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "Ellipse を選択中",
  args: {
    selection: DocumentSelection.fromNames(EllipseDocument, ["oval"]),
    tokenSelection: TokenSelection.create(EllipseDocument, Option.none)
  }
}`,...P.parameters?.docs?.source},description:{story:`Ellipse は \`border-radius: 50%\` で丸く描かれる（docs/03-schema.md「Ellipse 自体」）。
テストが守るのは宣言を出すところまでで、**それが実際に円として描かれることは見えない**
（happy-dom は CSS を描かない）。確かめる手段はこのストーリーの視覚差分だけ。`,...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    tokenSelection: TokenSelection.create(EmptyCanvasDocument, Option.none)
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正（凍結中）",
  args: {
    selection: sampleCanvasSelection(["home"]),
    isFrozen: true
  }
}`,...I.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき。最後に描けた内容が斜線のスクリムの下に残り、右上に「最
後に正常だった表示」のバッジが出る。

選んだままの artboard に選択の枠は残るが、リサイズハンドルは出ない。**この差はこのストー
リーにしか映らない**（凍結していない \`artboard を選択中\` と見比べる）。`,...I.parameters?.docs?.description}}},L=[`Default`,`Selected`,`TokenSelected`,`HiddenArtboardSelected`,`HiddenNodeSelected`,`EllipseSelected`,`Empty`,`Frozen`]}))();export{E as Default,P as EllipseSelected,F as Empty,I as Frozen,A as HiddenArtboardSelected,M as HiddenNodeSelected,D as Selected,O as TokenSelected,L as __namedExportsOrder,T as default};