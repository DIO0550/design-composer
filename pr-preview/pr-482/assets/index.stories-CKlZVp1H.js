import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-B8KoI15D.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,r as a,t as o}from"./context-menu-_mdp11yb.js";function s(e,t={}){return(0,l.jsx)(o.Item,{label:e,shortcut:n.none,tone:i.Normal,isEnabled:!0,onSelect:()=>{},...t},e)}function c(...e){return(0,l.jsx)(o.Group,{children:e},e.map(e=>e.key).join())}var l,u,d,f,p,m;e((()=>{t(),a(),l=r(),u={title:`components/ContextMenu`,component:o,parameters:{layout:`padded`,docs:{description:{component:`右クリックで開くメニュー。

**色・区切り・割り当ての欄はテストでは守れない。** class 名を assert すると実装詳細のテス
トになり、happy-dom は Tailwind を解決しないので、押せない行の淡色と \`Delete\` の赤に気づ
く手段はここの視覚差分だけ。

本番は窓の座標へ \`position: fixed\` で置くので、器は与えず \`at\` を左上に寄せて撮る。`}}},args:{at:{x:8,y:8},onClose:()=>{}},decorators:[e=>(0,l.jsx)(`div`,{className:`h-56`,children:(0,l.jsx)(e,{})})]},d={name:`ノードを選んでいるとき`,args:{children:[c(s(`Copy`,{shortcut:n.some(`⌘C`)}),s(`Paste`,{shortcut:n.some(`⌘V`)})),c(s(`Bring forward`,{shortcut:n.some(`⌘]`),isEnabled:!1}),s(`Send backward`,{shortcut:n.some(`⌘[`),isEnabled:!1})),c(s(`Detach instance`,{isEnabled:!1})),c(s(`Delete`,{shortcut:n.some(`Delete`),tone:i.Danger}))]}},f={name:`artboard を選んでいるとき`,args:{children:c(s(`Delete`,{shortcut:n.some(`Delete`),tone:i.Danger}))}},p={name:`空き領域を右クリックしたとき`,args:{children:[c(s(`Paste`,{shortcut:n.some(`⌘V`),isEnabled:!1})),c(s(`Undo`,{shortcut:n.some(`⌘Z`)}),s(`Redo`,{shortcut:n.some(`Shift+⌘Z`)}))]}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "ノードを選んでいるとき",
  args: {
    children: [group(row("Copy", {
      shortcut: Option.some("⌘C")
    }), row("Paste", {
      shortcut: Option.some("⌘V")
    })), group(row("Bring forward", {
      shortcut: Option.some("⌘]"),
      isEnabled: false
    }), row("Send backward", {
      shortcut: Option.some("⌘["),
      isEnabled: false
    })), group(row("Detach instance", {
      isEnabled: false
    })), group(row("Delete", {
      shortcut: Option.some("Delete"),
      tone: ContextMenuTones.Danger
    }))]
  }
}`,...d.parameters?.docs?.source},description:{story:`ノードを右クリックしたときの並び（docs/06-ui.md「コンテキストメニュー」）。

UI 案 docs/Design Composer.html の \`Context menu\` と同じ状態にしてある。artboard 直下に
1 つしか無いノードなので前面へ / 背面へは押せず、Box なのでインスタンスの解除も押せない。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいるとき",
  args: {
    children: group(row("Delete", {
      shortcut: Option.some("Delete"),
      tone: ContextMenuTones.Danger
    }))
  }
}`,...f.parameters?.docs?.source},description:{story:`artboard を右クリックしたときの並び。削除だけが並ぶ。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "空き領域を右クリックしたとき",
  args: {
    children: [group(row("Paste", {
      shortcut: Option.some("⌘V"),
      isEnabled: false
    })), group(row("Undo", {
      shortcut: Option.some("⌘Z")
    }), row("Redo", {
      shortcut: Option.some("Shift+⌘Z")
    }))]
  }
}`,...p.parameters?.docs?.source},description:{story:`空き領域を右クリックしたときの並び。貼る先が無いのでペーストは押せない。`,...p.parameters?.docs?.description}}},m=[`SelectedNode`,`SelectedArtboard`,`EmptyArea`]}))();export{p as EmptyArea,f as SelectedArtboard,d as SelectedNode,m as __namedExportsOrder,u as default};