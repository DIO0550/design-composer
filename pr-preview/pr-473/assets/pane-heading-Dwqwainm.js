import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";function n({children:e}){return(0,r.jsx)(`div`,{"data-testid":i,className:`flex h-11 shrink-0 items-center gap-2 border-gray-300 border-b px-3`,children:e})}var r,i,a=e((()=>{r=t(),i=`pane-heading`;try{n.displayName=`PaneHeading`,n.__docgenInfo={description:`ペインの上端に置く見出しの帯（UI 案 docs/Design Composer.html の右ペインの帯。44px）。
中身は並べる側が決めるので children で受ける。

中身が空になっても帯そのものは残るので、空のときにも指せるよう目印を持たせる。**中身
を省略可能にしない** — 渡し忘れと「意図して空にした」が書き分けられなくなる。

横断層に置くのは、右ペインの中身を持つ feature（\`inspector\` / \`tokens\`）のストーリー
がこの綴りを写さずに同じものを描けるようにするため（#297）。左ペインのパネルの帯（\`LeftPanePanel\`）
はこれではない（高さは同じだが \`gap-2\` を持たない）。本文（\`PaneBody\`）と 1 つの名前
空間にまとめないのは、親にあたる殻が \`features/editor\` に残り、親のいない名前空間にな
るため。

**この class を落としてもテストは 1 件も落ちない** — 目印が守るのは帯が在ることだけで、
高さ・下線・余白・間隔は happy-dom が解決しない。気づく手段は視覚差分だけ。`,displayName:`PaneHeading`,filePath:`/home/runner/work/design-composer/design-composer/src/components/pane-heading/index.tsx`,methods:[],props:{},tags:{returns:`受け取った中身を横に並べた、下線付きの固定高の帯`}}}catch{}try{i.displayName=`PaneHeadingTestId`,i.__docgenInfo={description:`帯を引くための目印。`,displayName:`PaneHeadingTestId`,filePath:`/home/runner/work/design-composer/design-composer/src/components/pane-heading/index.tsx`,methods:[],props:{},tags:{}}}catch{}}));export{a as n,n as t};