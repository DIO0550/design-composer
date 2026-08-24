import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./pane-heading-CMKY7S1-.js";function i({children:e}){return(0,a.jsx)(`div`,{className:`w-72 border border-gray-300 bg-white`,children:e})}var a,o,s,c,l;e((()=>{n(),a=t(),o={title:`components/PaneHeading`,component:r,parameters:{layout:`padded`,docs:{description:{component:`ペインの見出しの帯。中身の有無で 2 通りある。`}}},decorators:[e=>(0,a.jsx)(i,{children:(0,a.jsx)(e,{})})]},s={name:`中身が並ぶ`,args:{children:(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(`span`,{className:`text-[#00a0a0]`,children:`□`}),(0,a.jsx)(`span`,{className:`min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm`,children:`login-form`}),(0,a.jsx)(`span`,{className:`text-gray-400 text-xs`,children:`Box`})]})}},c={name:`中身が空`,args:{children:null}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "中身が並ぶ",
  args: {
    children: <>
        <span className="text-[#00a0a0]">□</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
          login-form
        </span>
        <span className="text-gray-400 text-xs">Box</span>
      </>
  }
}`,...s.parameters?.docs?.source},description:{story:`中身が並ぶとき。要素の間隔と左右の余白が見える。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "中身が空",
  args: {
    children: null
  }
}`,...c.parameters?.docs?.source},description:{story:`中身が空のとき。何も選んでいない状態がこれで、帯だけが高さを保って残る
（消すと選択のたびに本文の位置が帯のぶん動く）。`,...c.parameters?.docs?.description}}},l=[`Default`,`Empty`]}))();export{s as Default,c as Empty,l as __namedExportsOrder,o as default};