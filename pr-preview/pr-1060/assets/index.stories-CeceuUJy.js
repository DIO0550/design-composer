import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{i as n,r}from"./ArrayEx-BHJK9ofQ.js";import{n as i,t as a}from"./Option-9AUSRj2g.js";import{n as o,r as s,t as ee}from"./document-error-list-DRbyIxuU.js";import{n as c,t as l}from"./document-json-B1DsHMIn.js";import{i as u,n as te,r as ne,t as re}from"./document-tab-bar-B6tmxFzL.js";import{f as ie,g as ae,h as oe,m as se}from"./elapsed-DN7D91rk.js";import{a as ce,c as d,i as le,l as f,n as ue,o as de,r as fe,s as p,t as pe}from"./opened-document-editor-DeAAAxax.js";import{a as me,i as he}from"./document-ipc-D5jqKtbd.js";import{a as ge,c as _e,i as ve,l as ye,n as be,o as m,t as xe,u as Se}from"./document-start-BSvDHhYw.js";import{n as Ce,t as h}from"./opened-documents-B7pTX6Mm.js";import{a as we,c as g,o as _,s as Te,u as Ee}from"./use-canvas-view-C3K471WL.js";import{i as De,t as Oe}from"./document-open-failure-DkLI4F2h.js";function ke(e){let t=Object.values(v).find(t=>t===e);return a.fromNullable(t)}var v,y,b,Ae=e((()=>{i(),n(),v={Open:`open`,Create:`create`,CloseTab:`close-tab`},y=`document-menu`,b={create(e){return{async subscribeCommand(t){try{let n=await e.listen(y,e=>{let n=ke(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),x,je=e((()=>{d(),Ae(),x={create(){let e=p.create(y);return{menu:b.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Me(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Ne(e){return Me(e)?e:{message:String(e)}}function Pe(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var S,Fe=e((()=>{me(),i(),n(),S={create(e){let t=he.caller(e,Ne);return{async load(){return r.flatMap(await t(`load_app_state`,{}),Pe)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function C(e){return Promise.reject({message:`app-state.json: ${e}`})}var w,Ie=e((()=>{d(),i(),Fe(),w={create(e){let t=e,n=!1,r=!1,i=()=>n?C(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?C(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):f(`save_app_state: content が文字列でない`);return{ipc:S.create({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return f(`Command ${e} not found`)}},listen(e){return f(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}})),T,Le=e((()=>{n(),T={create(){let e=!1;return{appWindow:{close(){return e=!0,Promise.resolve(r.ok(void 0))}},isWindowClosed(){return e}}}}}));async function E(e){try{return r.ok(await e())}catch(e){return r.err({message:String(e)})}}var D,O,k,Re=e((()=>{n(),D={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},O=`untitled.dcmp`,k={create(e){return{chooseOpenPath(){return E(()=>e.chooseOpenPath(D))},chooseSavePath(){return E(()=>e.chooseSavePath(D,O))}}}}}));function A(e){switch(e.kind){case`chosen`:return Promise.resolve(a.some(e.path));case`canceled`:return Promise.resolve(a.none);case`failed`:return Promise.reject(Error(e.message))}}var j,M,N,ze=e((()=>{i(),Re(),j={kind:`canceled`},M={Canceled:j,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},N={create(e){return{dialog:k.create({chooseOpenPath(){return A(e.open)},chooseSavePath(){return A(e.save)}})}}}}));function Be(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?a.none:a.some(t)}var P,F,Ve=e((()=>{i(),n(),P=`tauri://drag-drop`,F={create(e){return{async subscribeDropped(t){try{let n=await e.listen(P,e=>{let n=Be(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}}})),I,He=e((()=>{d(),Ve(),I={create(){let e=p.create(P);return{drop:F.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),Ue=e((()=>{De(),be(),te(),_e(),ve()}));function We(e){Ee(Array.from({length:L},(t,n)=>({shortcut:{kind:Te.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var L,Ge=e((()=>{g(),L=9}));function Ke({opened:e,clock:t,ipc:n}){let r=h.activePath(e);return(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:h.documents(e).map(e=>{let i=e.path===r;return(0,z.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,z.jsx)(we,{scope:i?_.Listening:_.Suspended,children:(0,z.jsx)(pe,{clock:t,ipc:n,opened:e})})},e.path)})})}function R({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:s,tabActions:c,commandFailure:l}=ge(t),u=m.failure(n);return We(c.activateAt),m.hasOpenedDocuments(n)?(0,z.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,z.jsx)(re,{opened:n.documents.value,onSelect:c.activate,onClose:c.close,onReorder:c.reorder}),a.isSome(u)&&(0,z.jsx)(Oe,{failure:u.value}),(0,z.jsx)(Ke,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,z.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,z.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,z.jsx)(xe,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:i,commandFailure:l,renderErrors:e=>(0,z.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var z,qe=e((()=>{Ce(),s(),ue(),Ue(),Ge(),g(),i(),z=t();try{R.displayName=`EditorScreen`,R.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function B(e,t){let n=fe.create(e),r=N.create({open:M.chosen(W),save:M.chosen(`/work/untitled.dcmp`)}),i=I.create(),a=w.create(t===void 0?void 0:ye.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:x.create().menu,drop:i.drop,appState:a.ipc,appWindow:T.create().appWindow},drop:i}}var V,H,U,W,G,Je,K,Ye,q,J,Xe,Ze,Y,X,Z,Q,$;e((()=>{u(),se(),ae(),je(),Ie(),Se(),Le(),de(),ze(),le(),c(),He(),qe(),{expect:V,screen:H,waitFor:U}=__STORYBOOK_MODULE_TEST__,W=`/work/sample.dcmp`,G=`/work/settings.dcmp`,Je=`/work/missing.dcmp`,K={[W]:l.serialize(oe.document(ie)),[G]:ne(`settings`)},Ye=B(K),q=B(K),J=B(K),Xe=B(K,[W]),Ze={title:`features/editor/EditorScreen`,component:R,parameters:{layout:`fullscreen`},args:{clock:ce.create().clock,ports:Ye.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:Xe.ports}},Z={name:`複数開いている`,args:{ports:q.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),q.drop.dropFiles([W,G]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:J.ports},play:async()=>{await U(()=>{V(H.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),J.drop.dropFiles([W]),await U(()=>{V(H.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),J.drop.dropFiles([Je]),await U(()=>{V(H.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...Y.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "前回のファイルを開いた直後",
  args: {
    ports: restored.ports
  }
}`,...X.parameters?.docs?.source},description:{story:`前回開いていたファイルが起動時にそのまま開いた状態。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    ports: twoOpened.ports
  },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:`2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
（タブ列だけのストーリーでは器との合わせ目が映らない）。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "開いたまま開けなかった",
  args: {
    ports: openFailed.ports
  },
  play: async () => {
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(screen.getByRole("alert", {
        name: "ファイルを開けませんでした"
      })).toBeDefined();
    });
  }
}`,...Q.parameters?.docs?.source},description:{story:`開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,Ze as default};