import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./drop-position-label-CpzW1B2_.js";var i,a,o,s,c,l,u;e((()=>{n(),i=t(),a={title:`features/editor/ArtboardCanvas/DropPositionLabel`,component:r,parameters:{layout:`fullscreen`,docs:{description:{component:`落ちる位置を読ませるラベル（UI 案 docs/Design Composer.html の
\`into login-form · child 3 of 5\`）。

**このストーリーが唯一の見た目の防壁。** happy-dom はレイアウトを解決しないので
置き方（\`fixed\` と親の上へ持ち上げる量）はテストでは見えず、運んでいる最中の
キャンバスを映すストーリーも無い。

親の矩形を \`top: 60\` に置いているので、ラベルはその 18px 上（\`top: 42\`）に出る。
持ち上げ量を落とすと、ラベルが親の枠に載らず内側へ潜り込む。`}}},decorators:[e=>(0,i.jsxs)(`div`,{className:`h-64 w-full bg-gray-100`,children:[(0,i.jsx)(`div`,{"aria-hidden":!0,className:`absolute h-32 w-64 outline-2 outline-emerald-500 outline-dashed`,style:{left:`80px`,top:`60px`}}),(0,i.jsx)(e,{})]})]},o={left:80,top:60,width:256,height:128},s={name:`子の間へ落ちる`,args:{target:{position:{parentName:`login-form`,index:3},marker:{left:100,top:70,width:2,height:108},childCount:5,parentBounds:o}}},c={name:`先頭へ落ちる`,args:{target:{position:{parentName:`login-form`,index:0},marker:{left:84,top:70,width:2,height:108},childCount:5,parentBounds:o}}},l={name:`子がいない親へ落ちる`,args:{target:{position:{parentName:`very-long-container-name`,index:0},marker:{left:84,top:64,width:2,height:120},childCount:0,parentBounds:o}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "子の間へ落ちる",
  args: {
    target: {
      position: {
        parentName: "login-form",
        index: 3
      },
      marker: {
        left: 100,
        top: 70,
        width: 2,
        height: 108
      },
      childCount: 5,
      parentBounds: ParentBounds
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`子を 5 つ持つ親の、4 つ目の手前へ落ちるところ（UI 案と同じ数字）。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "先頭へ落ちる",
  args: {
    target: {
      position: {
        parentName: "login-form",
        index: 0
      },
      marker: {
        left: 84,
        top: 70,
        width: 2,
        height: 108
      },
      childCount: 5,
      parentBounds: ParentBounds
    }
  }
}`,...c.parameters?.docs?.source},description:{story:"先頭へ落ちるところ。`child 0 of 5` になる（0 起点なので日本語としては硬い）。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "子がいない親へ落ちる",
  args: {
    target: {
      position: {
        parentName: "very-long-container-name",
        index: 0
      },
      marker: {
        left: 84,
        top: 64,
        width: 2,
        height: 120
      },
      childCount: 0,
      parentBounds: ParentBounds
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`子がいない親。名前が長いと横へ伸びる（折り返さないことの確認を兼ねる）。`,...l.parameters?.docs?.description}}},u=[`BetweenChildren`,`AtHead`,`EmptyParent`]}))();export{c as AtHead,s as BetweenChildren,l as EmptyParent,u as __namedExportsOrder,a as default};