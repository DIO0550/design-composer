import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-DPVwNv8c.js";import{n as i,t as a}from"./pane-heading-DEpc67Ua.js";var o,s,c,l,u;e((()=>{n(),i(),o=t(),s={title:`components/PaneHeading`,component:a,parameters:{layout:`padded`,docs:{description:{component:`ペインの見出しの帯。中身の有無で 2 通りある。`}}},decorators:[e=>(0,o.jsx)(r,{height:`content`,children:(0,o.jsx)(e,{})})]},c={name:`中身が並ぶ`,args:{children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(`span`,{className:`text-[#00a0a0]`,children:`□`}),(0,o.jsx)(`span`,{className:`min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm`,children:`login-form`}),(0,o.jsx)(`span`,{className:`text-gray-400 text-xs`,children:`Box`})]})}},l={name:`中身が空`,args:{children:null}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source},description:{story:`中身が並ぶとき。要素の間隔と左右の余白が見える。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "中身が空",
  args: {
    children: null
  }
}`,...l.parameters?.docs?.source},description:{story:`中身が空のとき。何も選んでいない状態がこれで、帯だけが高さを保って残る
（消すと選択のたびに本文の位置が帯のぶん動く）。`,...l.parameters?.docs?.description}}},u=[`Default`,`Empty`]}))();export{c as Default,l as Empty,u as __namedExportsOrder,s as default};