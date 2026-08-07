export default function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

      .il-root {
        --paper:#F1F4F6; --card:#FFFFFF; --ink:#17222B; --muted:#5C6B77;
        --ghost:#9AA7B1; --line:#D9E0E6; --clip:#E4572E; --clip-dark:#C4441F;
        --gold-bg:#FBEEC9; --gold-ink:#8A6510; --teal-bg:#D7F2EE; --teal-ink:#0F766E;
        min-height:100vh; background:var(--paper); color:var(--ink);
        font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
        font-size:15px; line-height:1.45;
      }
      .il-root *, .il-root *::before, .il-root *::after { box-sizing:border-box; }
      .il-num { font-family:'IBM Plex Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums; }

      .il-top { display:flex; justify-content:space-between; align-items:center;
        padding:14px 16px; border-bottom:2px solid var(--ink); background:var(--card);
        position:sticky; top:0; z-index:5; }
      .il-brand { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:22px;
        letter-spacing:.12em; display:flex; align-items:center; gap:9px; cursor:pointer; background:none; border:none; color:inherit; padding:0; }
      .il-plate { width:16px; height:16px; border-radius:50%; background:var(--ink);
        box-shadow:inset 0 0 0 3.5px var(--card), inset 0 0 0 6px var(--ink); }
      .il-save { font-size:12px; color:var(--muted); min-width:60px; text-align:right; }
      .il-save-error { color:var(--clip-dark); }
      .il-topright { display:flex; align-items:center; gap:12px; }
      .il-navlink { background:none; border:none; color:var(--muted); font-size:13px; cursor:pointer; padding:0; text-decoration:underline; }

      .il-main { max-width:640px; margin:0 auto; padding:16px 16px 56px; }
      section { margin-bottom:26px; }
      .il-sechead { display:flex; justify-content:space-between; align-items:baseline; margin:6px 0 10px; }
      .il-sechead h2 { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:20px;
        letter-spacing:.1em; text-transform:uppercase; margin:0; }
      h3 { font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:19px;
        letter-spacing:.05em; text-transform:uppercase; margin:0 0 4px; }
      .il-muted { color:var(--muted); font-size:13px; margin:2px 0 0; }
      .il-empty { color:var(--muted); font-size:14px; border:1.5px dashed var(--line);
        border-radius:10px; padding:14px; text-align:center; margin-bottom:12px; }
      .il-back { margin-bottom:10px; }
      .il-arrow { font-size:18px; }

      .il-card { background:var(--card); border:1.5px solid var(--line); border-radius:12px;
        padding:14px; margin-bottom:10px; }
      .il-history { display:flex; width:100%; align-items:center; justify-content:space-between;
        gap:12px; text-align:left; cursor:pointer; font:inherit; color:inherit; }
      .il-history:hover { border-color:var(--ink); }
      .il-history .il-num { font-size:15px; font-weight:600; white-space:nowrap; }

      button { font:inherit; }
      .il-primary { background:var(--clip); color:#fff; border:none; border-radius:10px;
        padding:10px 18px; font-weight:600; cursor:pointer; letter-spacing:.02em; }
      .il-primary:hover { background:var(--clip-dark); }
      .il-primary:disabled { background:var(--line); color:var(--muted); cursor:not-allowed; }
      .il-ghost { background:transparent; border:1.5px solid var(--line); border-radius:10px;
        padding:9px 14px; color:var(--ink); cursor:pointer; }
      .il-ghost:hover { border-color:var(--ink); }
      .il-danger { color:var(--clip-dark); }
      .il-dashed { border-style:dashed; }
      .il-wide { width:100%; }
      .il-emptybtn { margin-bottom:22px; padding:13px; font-size:16px; }
      .il-primary:focus-visible, .il-ghost:focus-visible, .il-check:focus-visible, .il-unitbtn:focus-visible,
      .il-input:focus-visible, .il-chip-toggle:focus-visible, .il-history:focus-visible, .il-livebar-name:focus-visible,
      .il-tab:focus-visible, .il-select:focus-visible, .il-stepbtn:focus-visible, .il-restbtn:focus-visible, .il-linkbtn:focus-visible {
        outline:2.5px solid var(--clip); outline-offset:2px; }
      .il-btnrow { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; align-items:center; }
      .il-btnrow .il-wide { flex:1; width:auto; }
      .il-endrow { margin-top:20px; }

      .il-label { display:block; font-size:13px; color:var(--muted); margin:10px 0 4px; }
      .il-inlinelab { display:flex; align-items:center; gap:8px; margin:0; }
      .il-input { width:100%; border:1.5px solid var(--line); border-radius:9px; padding:9px 10px;
        background:var(--card); color:var(--ink); font-size:15px; }
      .il-input:disabled { background:var(--paper); color:var(--muted); }
      .il-input.ghost { color:var(--ghost); }
      .il-input-big { font-size:18px; margin-bottom:14px; }
      .il-input-notes { margin-top:8px; font-size:13px; }
      .il-input-sets { width:74px; }
      .il-select { border:1.5px solid var(--line); border-radius:9px; padding:8px 10px;
        background:var(--card); color:var(--ink); font-size:13px; }
      .il-exedit-row { display:flex; gap:8px; align-items:center; }
      .il-iconbox { display:grid; place-items:center; width:38px; height:38px; flex:none;
        border:1.5px solid var(--line); border-radius:9px; color:var(--muted); }
      .il-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .il-addhint { margin:8px 0 0; }
      .il-autoline { margin-top:8px; }
      .il-autotag { font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--teal-ink);
        background:var(--teal-bg); border-radius:5px; padding:1px 5px; margin-left:4px; }
      .il-linkbtn { background:none; border:none; color:var(--clip-dark); cursor:pointer;
        font-size:12px; text-decoration:underline; margin-left:8px; padding:0; }
      .il-exopts { display:flex; flex-wrap:wrap; gap:14px; margin-top:12px; align-items:center; }
      .il-sshint { margin:2px 0 14px; }

      .il-chip { display:inline-block; border-radius:999px; padding:3px 9px; font-size:11px;
        font-weight:700; letter-spacing:.06em; white-space:nowrap; }
      .il-chip-inline { margin-left:8px; vertical-align:1px; }
      .il-chip-toggle { background:var(--paper); border:1.5px solid var(--line); color:var(--muted);
        cursor:pointer; font-size:12px; font-weight:500; padding:5px 11px; }
      .il-chip-toggle.on { background:var(--ink); border-color:var(--ink); color:#fff; }
      .il-chip-pr { background:var(--gold-bg); color:var(--gold-ink); border:1px solid #E4CB84; }
      .il-chip-rep { background:var(--teal-bg); color:var(--teal-ink); border:1px solid #9BD8CF; }
      .il-chip-hr { background:#FDE8E4; color:var(--clip-dark); border:1px solid #F3B6A8; }

      .il-livebar { position:sticky; top:58px; z-index:4; background:var(--ink); color:#fff;
        border-radius:12px; padding:12px 16px; margin-bottom:14px; }
      .il-livebar-main { display:flex; justify-content:space-between; align-items:center; gap:10px; }
      .il-livebar-left { flex:1; min-width:0; }
      .il-livebar-name { font-family:'Barlow Condensed',sans-serif; font-weight:600; letter-spacing:.08em;
        text-transform:uppercase; font-size:17px; background:transparent; border:none; color:#fff;
        width:100%; padding:0; border-bottom:1.5px dashed rgba(255,255,255,.25); border-radius:0; }
      .il-livebar-vol { font-size:12px; color:#B8C4CD; margin-top:3px; }
      .il-clock { font-size:26px; font-weight:600; white-space:nowrap; }
      .il-restrow { display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        border-top:1px solid rgba(255,255,255,.15); margin-top:10px; padding-top:10px; }
      .il-restrow.over { color:#FFD98E; font-weight:600; }
      .il-restlabel { font-size:13px; }
      .il-resttime { font-size:18px; font-weight:600; }
      .il-restbtn { background:rgba(255,255,255,.12); color:#fff; border:none; border-radius:8px;
        padding:4px 10px; font-size:12px; cursor:pointer; }
      .il-restbtn:hover { background:rgba(255,255,255,.22); }
      .il-restbar-track { flex-basis:100%; height:4px; background:rgba(255,255,255,.15);
        border-radius:2px; overflow:hidden; }
      .il-restbar { display:block; height:100%; background:var(--clip); border-radius:2px;
        transition:width .4s linear; }
      @media (prefers-reduced-motion: reduce) { .il-restbar { transition:none; } }

      .il-exhead { display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .il-exhead-left { display:flex; align-items:center; gap:9px; min-width:0; flex-wrap:wrap; }
      .il-exhead-left h3 { margin:0; }
      .il-exicon { flex:none; color:var(--muted); }
      .il-exremove { padding:4px 10px; border:none; }
      .il-restcfg { display:flex; align-items:center; gap:8px; margin:4px 0 2px; }
      .il-stepbtn { width:28px; height:28px; border-radius:8px; border:1.5px solid var(--line);
        background:var(--card); cursor:pointer; font-size:15px; line-height:1; color:var(--ink); }
      .il-stepbtn:hover { border-color:var(--ink); }
      .il-restval { font-size:13px; min-width:38px; text-align:center; }

      .il-setgrid { display:grid; grid-template-columns:30px 1fr 1fr 46px minmax(64px,auto);
        gap:8px; align-items:center; }
      .il-sethead { font-size:10.5px; letter-spacing:.1em; color:var(--muted); margin:10px 0 6px; }
      .il-unitbtn { background:transparent; border:none; padding:0; text-align:left; cursor:pointer;
        font-size:10.5px; letter-spacing:.1em; font-weight:700; color:var(--clip-dark); }
      .il-unitbtn:hover { text-decoration:underline; }
      .il-setrow { margin-bottom:8px; }
      .il-setrow.done .il-input { border-color:transparent; }
      .il-setnum { color:var(--muted); font-size:13px; text-align:center; }
      .il-check { width:100%; height:40px; border-radius:9px; border:1.5px solid var(--line);
        background:var(--card); cursor:pointer; font-size:18px; color:#fff; }
      .il-check.on { background:var(--clip); border-color:var(--clip); }
      .il-badgecell { display:flex; flex-direction:column; gap:3px; align-items:flex-start; }
      .il-badgecell .il-chip { animation:il-pop .25s ease-out; }
      @keyframes il-pop { from { transform:scale(.6); opacity:0; } to { transform:scale(1); opacity:1; } }
      @media (prefers-reduced-motion: reduce) { .il-badgecell .il-chip { animation:none; } }
      .il-notes { color:var(--muted); font-size:13px; font-style:italic; margin:0 0 4px; }
      .il-sessionnote { margin:4px 0 8px; font-size:13px; border-style:dashed; background:#FDFCF8; }
      .il-sessionnote::placeholder { color:var(--ghost); font-style:italic; }
      .il-sessionnote-line { margin:6px 0 0; font-size:13.5px; }
      .il-sessionnote-line strong { font-weight:600; }

      .il-chartcard { padding:14px 10px 8px; }
      .il-chartbar { display:flex; justify-content:space-between; align-items:center; gap:10px;
        flex-wrap:wrap; padding:0 4px 10px; }
      .il-tabs { display:flex; background:var(--paper); border-radius:10px; padding:3px; gap:2px; }
      .il-tab { border:none; background:transparent; padding:6px 12px; border-radius:8px;
        font-size:13px; color:var(--muted); cursor:pointer; }
      .il-tab.on { background:var(--ink); color:#fff; font-weight:600; }
      .il-chartnote { text-align:center; padding-bottom:6px; }
      .il-chartwrap { width:100%; }

      .il-exlist { display:flex; align-items:center; gap:11px; }
      .il-exlist-info { display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }
      .il-exlist-info .il-muted { font-size:12.5px; }

      .il-overlay { position:fixed; inset:0; background:rgba(23,34,43,.5); display:grid;
        place-items:center; z-index:20; padding:20px; }
      .il-dialog { background:var(--card); border-radius:14px; padding:20px; max-width:360px; width:100%;
        border:1.5px solid var(--line); }
      .il-dialog p { margin:0 0 6px; }

      .il-statrow { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:12px 0 18px; }
      .il-stat { background:var(--card); border:1.5px solid var(--line); border-radius:12px;
        padding:12px 8px; text-align:center; }
      .il-stat-v { font-size:18px; font-weight:600; }
      .il-stat-l { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-top:3px; }
      .il-summary-date { margin:-6px 0 10px; }
      .il-prbox { border-color:#E4CB84; background:#FFFBF0; }
      .il-prline { display:flex; align-items:center; gap:10px; margin-top:8px; font-size:14px; }
      .il-musrow { display:grid; grid-template-columns:92px 1fr auto; gap:10px; align-items:center; margin-top:9px; }
      .il-muslabel { font-size:13px; }
      .il-musbar-track { background:var(--paper); border-radius:6px; height:14px; overflow:hidden; }
      .il-musbar { height:100%; background:var(--clip); border-radius:6px; }
      .il-musval { font-size:12px; color:var(--muted); white-space:nowrap; }
      .il-hrrow { display:flex; gap:8px; align-items:center; margin:10px 0 0; }
      .il-hrwait { font-size:12.5px; color:var(--muted); font-style:italic; margin:10px 0 0; }

      .il-authwrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
      .il-authcard { max-width:360px; width:100%; background:var(--card); border:1.5px solid var(--line);
        border-radius:14px; padding:28px 24px; }
      .il-authbrand { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:26px;
        letter-spacing:.12em; display:flex; align-items:center; gap:10px; margin-bottom:4px; }
      .il-authsub { color:var(--muted); font-size:13.5px; margin:0 0 20px; }
      .il-autherr { color:var(--clip-dark); font-size:13px; margin:10px 0 0; }
      .il-codeinput { letter-spacing:.4em; font-family:'IBM Plex Mono',ui-monospace,monospace;
        font-size:20px; text-align:center; }
      .il-tokenbox { font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:13px;
        background:var(--paper); border:1.5px dashed var(--line); border-radius:9px; padding:12px;
        word-break:break-all; margin:10px 0; }
      .il-urlbox { font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:12.5px;
        background:var(--paper); border-radius:9px; padding:10px 12px; word-break:break-all; margin:6px 0 0; }
      .il-textarea { width:100%; min-height:160px; border:1.5px solid var(--line); border-radius:9px;
        padding:10px; background:var(--card); color:var(--ink); font-family:'IBM Plex Mono',ui-monospace,monospace;
        font-size:12.5px; resize:vertical; }

      .il-altcode { margin:16px 0 6px; padding-top:14px; border-top:1.5px solid var(--line); font-size:12.5px; }
      .il-sronly { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
        clip:rect(0,0,0,0); white-space:nowrap; border:0; }

      .il-savebanner { background:#FDE8E4; border-bottom:1.5px solid #F3B6A8; }
      .il-savebanner-in { max-width:640px; margin:0 auto; padding:11px 16px; font-size:13px;
        line-height:1.5; color:var(--clip-dark); display:flex; gap:10px; align-items:flex-start; }
      .il-savebanner-in strong { font-weight:700; flex:none; }
      .il-savebanner-x { margin-left:auto; background:none; border:none; color:var(--clip-dark);
        cursor:pointer; font-size:14px; padding:0 2px; flex:none; }

      .il-healthnote { background:#FFF8F5; border:1.5px solid #F3B6A8; border-radius:10px;
        padding:11px 13px; font-size:12.5px; line-height:1.5; color:var(--ink); margin:0 0 16px; }
      .il-healthnote strong { font-weight:700; }
      .il-consent { display:flex; gap:9px; align-items:flex-start; margin:14px 0 4px;
        font-size:12.5px; line-height:1.5; color:var(--muted); cursor:pointer; }
      .il-consent input { margin-top:2px; width:17px; height:17px; flex:none; accent-color:var(--clip); cursor:pointer; }
      .il-consent .il-linkbtn { margin-left:0; font-size:12.5px; }
      .il-consenthint { text-align:center; font-size:12px; margin-top:8px; }
      .il-legal-links { text-align:center; margin:18px 0 0; font-size:12px; }
      .il-legal-links .il-linkbtn { margin:0 2px; font-size:12px; color:var(--muted); }

      .il-legal-modal { background:var(--card); border:1.5px solid var(--line); border-radius:14px;
        max-width:660px; width:100%; max-height:86vh; display:flex; flex-direction:column; }
      .il-legal-scroll { overflow-y:auto; padding:22px 22px 6px; -webkit-overflow-scrolling:touch; }
      .il-legal-foot { padding:12px 22px 16px; margin-top:0; border-top:1.5px solid var(--line); }
      .il-legal-title { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:23px;
        letter-spacing:.08em; text-transform:uppercase; margin:0 0 2px; }
      .il-legal-meta { color:var(--muted); font-size:12px; margin:0 0 16px; }
      .il-legal-sec { margin-bottom:16px; }
      .il-legal-sec.important { background:#FFF8F5; border:1.5px solid #F3B6A8; border-radius:10px; padding:12px 14px; }
      .il-legal-h { font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:16px;
        letter-spacing:.05em; text-transform:uppercase; margin:0 0 5px; }
      .il-legal-p { font-size:13px; line-height:1.6; margin:0 0 8px; color:var(--ink); }
      .il-legal-p:last-child { margin-bottom:0; }

      @media (max-width:430px) {
        .il-setgrid { grid-template-columns:24px 1fr 1fr 42px minmax(58px,auto); gap:6px; }
        .il-clock { font-size:22px; }
        .il-exopts { gap:10px; }
      }
    `}</style>
  );
}
