import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,n as r,r as i,t as a}from"./button-yZIDHcCZ.js";function o({kind:e,label:t}){return(0,s.jsx)(`div`,{className:`grid grid-cols-[auto_auto_auto] items-center justify-start gap-3 text-[11px] text-gray-500`,children:[i.Small,i.Regular,i.Large].map(n=>(0,s.jsxs)(`div`,{className:`contents`,children:[(0,s.jsx)(`span`,{children:n}),(0,s.jsx)(`span`,{children:(0,s.jsx)(a,{kind:e,size:n,children:t})}),(0,s.jsx)(`span`,{children:(0,s.jsx)(a,{kind:e,size:n,disabled:!0,children:t})})]},n))})}var s,c,l,u,d,f,p,m,h;e((()=>{n(),s=t(),c={title:`components/Button`,parameters:{layout:`padded`,docs:{description:{component:`基本のボタン。種類ごとに 1 本で、平常と押せないときを並べる。箱型は大きさも並べる。

hover の見え方は視覚差分では撮れないので、Storybook で触って確かめる。`}}}},l={name:`プライマリ`,render:()=>(0,s.jsx)(o,{kind:r.Primary,label:`Go to source component`})},u={name:`セカンダリ`,render:()=>(0,s.jsx)(o,{kind:r.Secondary,label:`Detach instance`})},d={name:`デンジャー`,render:()=>(0,s.jsx)(o,{kind:r.Danger,label:`Delete token`})},f={name:`強調`,render:()=>(0,s.jsx)(o,{kind:r.Emphasis,label:`◆ Create component`})},p={name:`テキスト`,render:()=>(0,s.jsxs)(`div`,{className:`flex flex-col gap-3 text-gray-900 text-xs`,children:[(0,s.jsxs)(`p`,{children:[`2 nodes use this token`,` `,(0,s.jsx)(a,{kind:r.Text,children:`reveal in tree`})]}),(0,s.jsxs)(`p`,{children:[`2 nodes use this token`,` `,(0,s.jsx)(a,{kind:r.Text,disabled:!0,children:`reveal in tree`})]})]})},m={name:`アイコン`,render:()=>(0,s.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,s.jsx)(a,{kind:r.Icon,"aria-label":`追加`,children:`+`}),(0,s.jsx)(a,{kind:r.Icon,"aria-label":`追加`,disabled:!0,children:`+`})]})},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "プライマリ",
  render: () => <FramedKindSheet kind={ButtonKinds.Primary} label="Go to source component" />
}`,...l.parameters?.docs?.source},description:{story:`その場の主な操作。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "セカンダリ",
  render: () => <FramedKindSheet kind={ButtonKinds.Secondary} label="Detach instance" />
}`,...u.parameters?.docs?.source},description:{story:`主な操作の脇に置く、控えめな操作。`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "デンジャー",
  render: () => <FramedKindSheet kind={ButtonKinds.Danger} label="Delete token" />
}`,...d.parameters?.docs?.source},description:{story:`消す・壊す向きの操作。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "強調",
  render: () => <FramedKindSheet kind={ButtonKinds.Emphasis} label="◆ Create component" />
}`,...f.parameters?.docs?.source},description:{story:"その画面を代表する操作。中身に置いた `◆` もボタンの文字色を継ぐ。",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "テキスト",
  render: () => <div className="flex flex-col gap-3 text-gray-900 text-xs">
      <p>
        2 nodes use this token{" "}
        <Button kind={ButtonKinds.Text}>reveal in tree</Button>
      </p>
      <p>
        2 nodes use this token{" "}
        <Button kind={ButtonKinds.Text} disabled={true}>
          reveal in tree
        </Button>
      </p>
    </div>
}`,...p.parameters?.docs?.source},description:{story:`文の中に置く操作。前後の文と並べて、行の中での収まりを見る。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "アイコン",
  render: () => <div className="flex items-center gap-3">
      <Button kind={ButtonKinds.Icon} aria-label="追加">
        +
      </Button>
      <Button kind={ButtonKinds.Icon} aria-label="追加" disabled={true}>
        +
      </Button>
    </div>
}`,...m.parameters?.docs?.source},description:{story:`綴りを持たないアイコンだけの操作。`,...m.parameters?.docs?.description}}},h=[`Primary`,`Secondary`,`Danger`,`Emphasis`,`Text`,`Icon`]}))();export{d as Danger,f as Emphasis,m as Icon,l as Primary,u as Secondary,p as Text,h as __namedExportsOrder,c as default};