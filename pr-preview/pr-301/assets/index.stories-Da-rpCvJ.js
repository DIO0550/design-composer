import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./pane-body-DA_USLG7.js";function i({children:e}){return(0,a.jsx)(`div`,{className:`flex h-64 w-72 flex-col border border-gray-300 bg-white`,children:e})}var a,o,s,c,l,u;e((()=>{n(),a=t(),o=Array.from({length:20},(e,t)=>`行 ${t+1}`),s={title:`components/PaneBody`,component:r,parameters:{layout:`padded`,docs:{description:{component:`帯の下の本文。中身が枠に収まるかどうかで見え方が変わる。`}}},decorators:[e=>(0,a.jsx)(i,{children:(0,a.jsx)(e,{})})]},c={name:`中身が枠に収まる`,args:{children:(0,a.jsx)(`p`,{className:`text-gray-900 text-sm`,children:`プロパティの中身`})}},l={name:`中身が枠に収まらない`,args:{children:(0,a.jsx)(`ol`,{className:`flex flex-col gap-3 text-gray-900 text-sm`,children:o.map(e=>(0,a.jsx)(`li`,{children:e},e))})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "中身が枠に収まる",
  args: {
    children: <p className="text-gray-900 text-sm">プロパティの中身</p>
  }
}`,...c.parameters?.docs?.source},description:{story:`収まっているとき。四辺の余白だけが見える。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "中身が枠に収まらない",
  args: {
    children: <ol className="flex flex-col gap-3 text-gray-900 text-sm">
        {OverflowingRows.map(row => <li key={row}>{row}</li>)}
      </ol>
  }
}`,...l.parameters?.docs?.source},description:{story:`収まらないとき。スクロールバーが出て、はみ出した分は枠の外へ出ない。`,...l.parameters?.docs?.description}}},u=[`Default`,`Overflowing`]}))();export{c as Default,l as Overflowing,u as __namedExportsOrder,s as default};