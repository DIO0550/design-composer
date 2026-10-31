import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-BhJkRR4J.js";import{n as i,t as a}from"./Option-CDM2xxmf.js";import{n as o,r as s,t as ee}from"./document-error-list-CLUKui9q.js";import{i as c,n as l,r as u,t as d}from"./file-paths-DanK4YB2.js";import{n as te,t as ne}from"./document-json-D-GhvhX0.js";import{i as re,n as ie,r as ae,t as oe}from"./document-tab-bar-8m7eYU7J.js";import{f as se,g as ce,h as le,m as ue}from"./elapsed-BH5NhqBD.js";import{S as de,_ as fe,b as f,v as p,y as pe}from"./use-node-drag-BtTDE3Id.js";import{a as me,c as m,i as h,l as g,n as he,o as ge,r as _e,s as _,t as ve}from"./opened-document-editor-Dym-tRyX.js";import{a as v,i as y}from"./document-ipc-B4vDOf-b.js";import{a as ye,c as be,i as xe,l as Se,n as Ce,o as b,t as we,u as Te}from"./document-start-BSaKr26y.js";import{n as Ee,t as x}from"./opened-documents-DsMQZtFf.js";import{i as De,t as Oe}from"./document-open-failure-BWXMMhJX.js";function ke(e){let t=Object.values(S).find(t=>t===e);return a.fromNullable(t)}function Ae(e){return{async subscribeCommand(t){try{let n=await e.listen(C,e=>{let n=ke(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var S,C,je=e((()=>{i(),n(),S={Open:`open`,Create:`create`,CloseTab:`close-tab`},C=`document-menu`}));function Me(){let e=_(C);return{menu:Ae(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}var Ne=e((()=>{m(),je()}));function Pe(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Fe(e){return Pe(e)?e:{message:String(e)}}function Ie(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}function Le(e){let t=y.caller(e,Fe);return{async load(){return r.flatMap(await t(`load_app_state`,{}),Ie)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}var Re=e((()=>{v(),i(),n()}));function w(e){return Promise.reject({message:`app-state.json: ${e}`})}function ze(e){let t=e,n=!1,r=!1,i=()=>n?w(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?w(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):g(`save_app_state: content が文字列でない`);return{ipc:Le({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return g(`Command ${e} not found`)}},listen(e){return g(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}var Be=e((()=>{m(),i(),Re()}));function T(e){let t=y.caller(e,e=>({message:String(e)}));return{async close(){return r.map(await t(`close_current_window`,{}),()=>void 0)}}}var Ve=e((()=>{v(),n()}));function He(){let e=!1,t=!1,n=()=>t?g(`close_current_window: ウィンドウを閉じられない`):(e=!0,Promise.resolve(void 0));return{appWindow:T({invoke(e){return e===`close_current_window`?n():g(`Command ${e} not found`)},listen(e){return g(`Event ${e} not emitted`)}}),isWindowClosed(){return e},denyClose(){t=!0}}}var Ue=e((()=>{m(),Ve()}));function We(e){if(!a.isSome(e))return r.ok(a.none);let t=u.create(e.value);return a.isSome(t)?r.ok(t):r.err({message:`選ばれたパスがファイル名を持たない: ${e.value}`})}async function E(e){try{return We(await e())}catch(e){return r.err({message:String(e)})}}function Ge(e){return{chooseOpenPath(){return E(()=>e.chooseOpenPath(D))},chooseSavePath(){return E(()=>e.chooseSavePath(D,O))}}}var D,O,Ke=e((()=>{c(),i(),n(),D={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},O=`untitled.dcmp`}));function k(e){switch(e.kind){case`chosen`:return Promise.resolve(a.some(e.path));case`canceled`:return Promise.resolve(a.none);case`failed`:return Promise.reject(Error(e.message))}}function qe(e){return{dialog:Ge({chooseOpenPath(){return k(e.open)},chooseSavePath(){return k(e.save)}})}}var A,j,Je=e((()=>{i(),Ke(),A={kind:`canceled`},j={Canceled:A,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}}}));function Ye(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;if(!Array.isArray(t)||!t.every(e=>typeof e==`string`))return a.none;let n=t.flatMap(e=>{let t=u.create(e);return a.isSome(t)?[t.value]:[]});return n.length>0?a.some(n):a.none}function Xe(e){return{async subscribeDropped(t){try{let n=await e.listen(M,e=>{let n=Ye(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var M,Ze=e((()=>{c(),i(),n(),M=`tauri://drag-drop`}));function Qe(){let e=_(M);return{drop:Xe(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}var $e=e((()=>{m(),Ze()})),et=e((()=>{De(),Ce(),ie(),be(),xe()}));function tt(e){de(Array.from({length:N},(t,n)=>({shortcut:{kind:pe.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var N,nt=e((()=>{f(),N=9}));function rt({opened:e,clock:t,ipc:n}){let r=x.activePath(e);return(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:x.documents(e).map(e=>{let i=e.path===r;return(0,F.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,F.jsx)(fe,{scope:i?p.Listening:p.Suspended,children:(0,F.jsx)(ve,{clock:t,ipc:n,opened:e})})},e.path)})})}function P({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:s,tabActions:c,commandFailure:l}=ye(t),u=b.failure(n);return tt(c.activateAt),b.hasOpenedDocuments(n)?(0,F.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,F.jsx)(oe,{opened:n.documents.value,onSelect:c.activate,onClose:c.close,onReorder:c.reorder}),a.isSome(u)&&(0,F.jsx)(Oe,{failure:u.value}),(0,F.jsx)(rt,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,F.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,F.jsx)(we,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:i,commandFailure:l,renderErrors:e=>(0,F.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var F,it=e((()=>{Ee(),s(),he(),et(),nt(),f(),i(),F=t();try{P.displayName=`EditorScreen`,P.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ canonicalize(path: FilePath): Promise<Result<FilePath, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; ... 4 more ...; subscribeChanged(listener: (changed: Readonly<...>) => void): Promise<...>; }>; ... 4 more ...; appWindow: Readonly<...>; }>`}}},tags:{}}}catch{}}));function I(e,t){let n=_e(e),r=qe({open:j.chosen(B),save:j.chosen(`/work/untitled.dcmp`)}),i=Qe(),a=ze(t===void 0?void 0:Se.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:Me().menu,drop:i.drop,appState:a.ipc,appWindow:He().appWindow},drop:i}}var L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{l(),re(),ue(),ce(),Ne(),Be(),Te(),Ue(),ge(),Je(),h(),te(),$e(),it(),{expect:L,screen:R,waitFor:z}=__STORYBOOK_MODULE_TEST__,B=d(`/work/sample.dcmp`),V=d(`/work/settings.dcmp`),H=d(`/work/missing.dcmp`),U={[B]:ne.serialize(le.document(se)),[V]:ae(`settings`)},W=I(U),G=I(U),K=I(U),q=I(U,[B]),J={title:`features/editor/EditorScreen`,component:P,parameters:{layout:`fullscreen`},args:{clock:me().clock,ports:W.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:q.ports}},Z={name:`複数開いている`,args:{ports:G.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),G.drop.dropFiles([B,V]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:K.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),K.drop.dropFiles([B]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),K.drop.dropFiles([H]),await z(()=>{L(R.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,J as default};