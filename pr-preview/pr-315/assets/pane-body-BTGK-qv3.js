import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";function n({children:e}){return(0,r.jsx)(`div`,{className:`min-h-0 flex-1 overflow-auto p-3`,children:e})}var r,i=e((()=>{r=t();try{n.displayName=`PaneBody`,n.__docgenInfo={description:`帯（\`PaneHeading\`）の下に置く本文。縦スクロールはここが受ける。

ペインの器ではなくここが余白を持つのは、帯の下線をペインの両端まで届かせるため。

横断層に置いているのは、右ペインの中身を持つ feature（\`inspector\` / \`tokens\`）の
ストーリーが、この綴りを写さずに同じものを描けるようにするため（#297）。

**この器を落としてもテストは 1 件も落ちない** — 持っているのはスクロールと余白だけで、
happy-dom はそれを解決しない。気づく手段は、これを描いているストーリーの視覚差分だけ。
中身をそのまま出すことだけは、これを着せている編集画面のテストが守っている
（ここに \`__tests__/\` を置いていないのはそのため）。`,displayName:`PaneBody`,filePath:`/home/runner/work/design-composer/design-composer/src/components/pane-body/index.tsx`,methods:[],props:{},tags:{returns:`受け取った中身を、余白付きで縦スクロールする枠に入れたもの`}}}catch{}}));export{i as n,n as t};