import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-BPcpmR5m.js";import{n as i,t as a}from"./pane-body-BnHUDQ4l.js";var o,s,c,l,u,d;e((()=>{n(),i(),o=t(),s=Array.from({length:20},(e,t)=>`行 ${t+1}`),c={title:`components/PaneBody`,component:a,parameters:{layout:`padded`,docs:{description:{component:`帯の下の本文。中身が枠に収まるかどうかで見え方が変わる。`}}},decorators:[e=>(0,o.jsx)(r,{height:`pane`,children:(0,o.jsx)(e,{})})]},l={name:`中身が枠に収まる`,args:{children:(0,o.jsx)(`p`,{className:`text-gray-900 text-sm`,children:`プロパティの中身`})}},u={name:`中身が枠に収まらない`,args:{children:(0,o.jsx)(`ol`,{className:`flex flex-col gap-3 text-gray-900 text-sm`,children:s.map(e=>(0,o.jsx)(`li`,{children:e},e))})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "中身が枠に収まる",
  args: {
    children: <p className="text-gray-900 text-sm">プロパティの中身</p>
  }
}`,...l.parameters?.docs?.source},description:{story:`収まっているとき。四辺の余白だけが見える。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "中身が枠に収まらない",
  args: {
    children: <ol className="flex flex-col gap-3 text-gray-900 text-sm">
        {OverflowingRows.map(row => <li key={row}>{row}</li>)}
      </ol>
  }
}`,...u.parameters?.docs?.source},description:{story:`収まらないとき。スクロールバーが出て、はみ出した分は枠の外へ出ない。`,...u.parameters?.docs?.description}}},d=[`Default`,`Overflowing`]}))();export{l as Default,u as Overflowing,d as __namedExportsOrder,c as default};