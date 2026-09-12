import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-f-DIDSWZ.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,r as a,t as o}from"./context-menu-vUcT2kRC.js";function s(e,t={}){return(0,l.jsx)(o.Item,{label:e,shortcut:n.none,tone:i.Normal,isEnabled:!0,onSelect:()=>{},...t},e)}function c(...e){return(0,l.jsx)(o.List,{children:e},e.map(e=>e.key).join())}var l,u=e((()=>{a(),t(),l=r();try{s.displayName=`row`,s.__docgenInfo={description:`1 行。既定は「押せる・通常の色・割り当てなし」。`,displayName:`row`,filePath:`/home/runner/work/design-composer/design-composer/src/components/context-menu/__stories__/menu-content.tsx`,methods:[],props:{},tags:{param:`label 行の綴り
props 確かめたい項目だけ。省いたものは既定で埋まる`,returns:`メニューへ入れる 1 行`}}}catch{}try{c.displayName=`list`,c.__docgenInfo={description:`行を 1 組にまとめる。組のあいだに区切りが入る。`,displayName:`list`,filePath:`/home/runner/work/design-composer/design-composer/src/components/context-menu/__stories__/menu-content.tsx`,methods:[],props:{},tags:{param:`rows 並べる行`,returns:`メニューへ入れる 1 組`}}}catch{}})),d,f,p,m,h,g;e((()=>{a(),t(),u(),d=r(),f={title:`components/ContextMenu`,component:o,parameters:{layout:`padded`,docs:{description:{component:`右クリックで開くメニュー。

**色・区切り・割り当ての欄はテストでは守れない。** class 名を assert すると実装詳細のテス
トになり、happy-dom は Tailwind を解決しないので、押せない行の淡色と \`Delete\` の赤に気づ
く手段はここの視覚差分だけ。

本番は窓の座標へ \`position: fixed\` で置くので、器は与えず \`at\` を左上に寄せて撮る。`}}},args:{at:{x:8,y:8},onClose:()=>{}},decorators:[e=>(0,d.jsx)(`div`,{className:`h-56`,children:(0,d.jsx)(e,{})})]},p={name:`ノードを選んでいるとき`,args:{children:[c(s(`Copy`,{shortcut:n.some(`⌘C`)}),s(`Paste`,{shortcut:n.some(`⌘V`)})),c(s(`Bring forward`,{shortcut:n.some(`⌘]`),isEnabled:!1}),s(`Send backward`,{shortcut:n.some(`⌘[`),isEnabled:!1})),c(s(`Detach instance`,{isEnabled:!1})),c(s(`Delete`,{shortcut:n.some(`Delete`),tone:i.Danger}))]}},m={name:`artboard を選んでいるとき`,args:{children:c(s(`Delete`,{shortcut:n.some(`Delete`),tone:i.Danger}))}},h={name:`空き領域を右クリックしたとき`,args:{children:[c(s(`Paste`,{shortcut:n.some(`⌘V`),isEnabled:!1})),c(s(`Undo`,{shortcut:n.some(`⌘Z`)}),s(`Redo`,{shortcut:n.some(`Shift+⌘Z`)}))]}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "ノードを選んでいるとき",
  args: {
    children: [list(row("Copy", {
      shortcut: Option.some("⌘C")
    }), row("Paste", {
      shortcut: Option.some("⌘V")
    })), list(row("Bring forward", {
      shortcut: Option.some("⌘]"),
      isEnabled: false
    }), row("Send backward", {
      shortcut: Option.some("⌘["),
      isEnabled: false
    })), list(row("Detach instance", {
      isEnabled: false
    })), list(row("Delete", {
      shortcut: Option.some("Delete"),
      tone: ContextMenuTones.Danger
    }))]
  }
}`,...p.parameters?.docs?.source},description:{story:`ノードを右クリックしたときの並び（docs/06-ui.md「コンテキストメニュー」）。

UI 案 docs/Design Composer.html の \`Context menu\` と同じ状態にしてある。artboard 直下に
1 つしか無いノードなので前面へ / 背面へは押せず、Box なのでインスタンスの解除も押せない。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいるとき",
  args: {
    children: list(row("Delete", {
      shortcut: Option.some("Delete"),
      tone: ContextMenuTones.Danger
    }))
  }
}`,...m.parameters?.docs?.source},description:{story:`artboard を右クリックしたときの並び。削除だけが並ぶ。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "空き領域を右クリックしたとき",
  args: {
    children: [list(row("Paste", {
      shortcut: Option.some("⌘V"),
      isEnabled: false
    })), list(row("Undo", {
      shortcut: Option.some("⌘Z")
    }), row("Redo", {
      shortcut: Option.some("Shift+⌘Z")
    }))]
  }
}`,...h.parameters?.docs?.source},description:{story:`空き領域を右クリックしたときの並び。貼る先が無いのでペーストは押せない。`,...h.parameters?.docs?.description}}},g=[`SelectedNode`,`SelectedArtboard`,`EmptyArea`]}))();export{h as EmptyArea,m as SelectedArtboard,p as SelectedNode,g as __namedExportsOrder,f as default};