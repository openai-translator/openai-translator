var YG = function(x, S) {
    var i, D, e = {},
        L = {},
        Y = [],
        n = "1.1",
        k = 1,
        M = 1024,
        G = 2048,
        H = 4096,
        W = !1;
    var B = !1;
    var U = { NONE: 0, YG: 1, PARTNER: 2 },
        z = { ELEMENT: 0, STYLE: 1, CLS: 2 };
    var q = { LEFT: 1, RIGHT: 2, TOP: 4, BOTTOM: 8 },
        F = { ADSENSE: 0, OTHER: 1 };
    var V = q.LEFT;

    function Z(e) {
        var t = "???";
        switch (Number(e)) {
            case q.TOP:
                t = "plc_top";
                break;
            case q.BOTTOM:
                t = "plc_bottom";
                break;
            case q.LEFT:
                t = "plc_left";
                break;
            case q.RIGHT:
                t = "plc_right"
        }
        return t
    }
    var j = "%%AF%%",
        J = { type: F.ADSENSE, responsive: !0, code: "<ins class='adsbygoogle' style='display:block' data-ad-client='ca-pub-4884889260645232' data-ad-slot='7940721009' data-ad-format='" + j + "'></ins>" },
        Q = 30;
    var X = 120;
    var K = { PLAYER: 1, OUTDATED_BROWSER: 2, TIMEOUT: 3, BOT: 4 };
    var W_ACTION = { ERROR: 1, WIDGET_RESIZE: 2, SERVER_HIT: 3, ADV: 4, SEARCH_DONE: 20, VIDEO_CHANGE: 21, CAPTION_CHANGE: 22, CAPTION_CONSUMED: 23, PLAYER_READY: 40, PLAYER_STATECHANGE: 41, PLAYER_SPEED_UPDATED: 42, UNREADY: 100 };
    var P_ACTION
    var t = !(P_ACTION = { PLAY: 1, REPLAY: 2, PAUSE: 3, PREV: 4, NEXT: 5, DELTA: 6, SEARCH: 7, SIZE: 8, SETPLAYERSPEED: 9 });

    function a(e) { try { return JSON.parse(e) } catch (e) {} return "" }

    function o(e) {
        if ("https://youglish.com" === (e.origin || e.originalEvent.origin)) {
            var t = a(e.data);
            console.log("Received data from YouGlish:", t);
            if (t && t.wid && t.action) {
                if (!L[t.wid]) return;
                if (L[t.wid].serverHit(), t.action === W_ACTION.WIDGET_RESIZE) {
                    var o = t.update === S || 1 == t.update;
                    L[t.wid].resize(t.width, t.height, o)
                } else t.action === W_ACTION.ADV ? (B = 1 == t.is_partner, console.log("------------v: " + n), console.log("Ads raw data: " + e.data), console.log("-> key used: " + t.key + " -isPartner: " + B + " -adToDisplay: " + function(e) {
                    var t = "???";
                    switch (Number(e)) {
                        case U.NONE:
                            t = "NONE";
                            break;
                        case U.YG:
                            t = "YG";
                            break;
                        case U.PARTNER:
                            t = "PARTNER"
                    }
                    return t
                }(t.ads_display)), console.log("-> YGAds: " + t.ads_code + " -YGLocations: " + t.ads_loc), console.log("------------"), L[t.wid].setAdConfig(t.ads_display, a(t.ads_code), t.ads_loc, 1 == Number(t.show_logo))) : t.action === W_ACTION.SEARCH_DONE ? (L[t.wid].display(), L[t.wid].broadcast("onSearchDone", t), L[t.wid].broadcast("onFetchDone", t)) : t.action === W_ACTION.VIDEO_CHANGE ? L[t.wid].broadcast("onVideoChange", t) : t.action === W_ACTION.CAPTION_CHANGE ? L[t.wid].broadcast("onCaptionChange", t) : t.action === W_ACTION.CAPTION_CONSUMED ? L[t.wid].broadcast("onCaptionConsumed", t) : t.action === W_ACTION.PLAYER_READY ? (L[t.wid].setReady(!0), L[t.wid].broadcast("onPlayerReady", t)) : t.action === W_ACTION.PLAYER_STATECHANGE ? L[t.wid].broadcast("onPlayerStateChange", t) : t.action === W_ACTION.PLAYER_SPEED_UPDATED ? (L[t.wid].onSpeedUpdated(t.speed), L[t.wid].broadcast("onSpeedChange", t)) : t.action === W_ACTION.ERROR ? +t.code == K.BOT ? L[t.wid].display(!1) : (+t.code == K.OUTDATED_BROWSER && (L[t.wid].display(), L[t.wid].resize(t.width, t.height, !1), i && clearTimeout(i), i = setTimeout(function() { L[t.wid].close() }, 3e3)), L[t.wid].broadcast("onError", t)) : t.action === W_ACTION.UNREADY && L[t.wid].setReady(!1)
            }
        }
    }

    function $(e) { return encodeURIComponent(e).replace(/\-/g, "%2D").replace(/\_/g, "%5F").replace(/\./g, "%2E").replace(/\!/g, "%21").replace(/\~/g, "%7E").replace(/\*/g, "%2A").replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29") }

    function ee(e, t) { e && (e.contentWindow || e.contentDocument).postMessage(JSON.stringify(t), "*") }

    function r(e) { e && (L = {}, Y = []); for (var t = document.querySelectorAll("a.youglish-widget"), o = 0; o < t.length; o++) l(t[o]) }

    function l(e) { var t = new s(e.id, { width: e.getAttribute("width") || e.getAttribute("data-width"), height: e.getAttribute("height") || e.getAttribute("data-height"), components: e.getAttribute("data-components"), scroll: e.getAttribute("data-scroll"), backgroundColor: e.getAttribute("data-bkg-color"), linkColor: e.getAttribute("data-link-color"), titleColor: e.getAttribute("data-ttl-color"), captionColor: e.getAttribute("data-cap-color"), markerColor: e.getAttribute("data-marker-color"), queryColor: e.getAttribute("data-query-color"), captionSize: e.getAttribute("data-cap-size"), restrictionMode: e.getAttribute("data-rest-mode"), videoQuality: e.getAttribute("data-video-quality"), title: e.getAttribute("data-title"), toggleUI: e.getAttribute("data-toggle-ui"), autoStart: e.getAttribute("data-auto-start"), panelsBackgroundColor: e.getAttribute("data-panels-bkg-color"), textColor: e.getAttribute("data-text-color"), keywordColor: e.getAttribute("data-keyword-color"), client: e.getAttribute("data-client"), lang: e.getAttribute("data-lang"), accent: e.getAttribute("data-accent") }); + e.getAttribute("data-delay-load") || t.fetch(e.getAttribute("data-query"), e.getAttribute("data-lang"), e.getAttribute("data-accent")) }

    function s(e, t) {
        var p, y, r, o, i = {},
            l = 0,
            s = null,
            E = !1,
            f = !1;
        o = e, p = ("object" == typeof HTMLElement ? o instanceof HTMLElement : o && "object" == typeof o && null !== o && 1 === o.nodeType && "string" == typeof o.nodeName) ? e.getAttribute("id") : e, y = "fr_" + p;
        var A = t || {},
            n = {};
        if (A.scroll = A.scroll ? A.scroll : "inner", A.components = A.components ? A.components : 255, A.events)
            for (var a in A.events) N(a, A.events[a]);

        function h(e, t, o, i, n) { return "<" + e + (t ? " id='" + t + "'" : "") + (o ? " class='" + o + "'" : "") + (i ? " style='" + i + "'" : "") + ">" + (n || "") + "</" + e + ">" }

        function c(e, t, o, i) {
            if (f && !i) C(), ee(R(), { source: "youglish", action: P_ACTION.SEARCH, query: e, lang: t, accent: o, cid: i });
            else {
                var n = Number(A.components);
                if (u = e, !(0 < (n & k) || u)) return;
                var a = (d = A.width, g = A.height, "position: static;visibility: visible;display: inline-block;padding: 0px;border: none;max-width: 100%;margin-top: 0px;margin-bottom: 1px;width: " + (d = d && 0 < Number(d) ? d + "px" : "100%") + ";height: " + (g = g && 0 < Number(g) ? g + "px" : "1px")),
                    r = function(e, t, o, i, n, a, r, l, s, c, d, g, u, p, y, E, f, A, h, b, m, _, v, T, N, C) {
                        var R = !1,
                            w = r,
                            O = a;
                        r && 0 < Number(r) ? "inner" != l && (r = -1) : (R = !0, r = -1);
                        var P = "";
                        return P = C ? "https://youglish.com/getbyid/" + C + "/" + $(t) + "/" + (o || "-1") + "/" + (i ? i.toLowerCase() : "all") : "https://youglish.com/pronounce/" + (t ? $(t) : "") + "/" + (o || "-1") + "/" + (i ? i.toLowerCase() : "all"), P += "/emb=1&e_id=" + e + "&e_comp=" + n + (null == b ? "" : "&e_start=" + b) + (r ? "&e_h=" + r : "") + (R ? "&e_notif_h=1" : "") + (N ? "&e_hidepwdby=1" : "") + (s ? "&e_bg_color=" + $(s) : "") + (m ? "&e_partbg_color=" + $(m) : "") + (_ ? "&e_txt_color=" + $(_) : "") + (v ? "&e_kw_color=" + $(v) : "") + (c ? "&e_link_color=" + $(c) : "") + (d ? "&e_ttl_color=" + $(d) : "") + (g ? "&e_cap_color=" + $(g) : "") + (u ? "&e_marker_color=" + $(u) : "") + (p ? "&e_query_color=" + $(p) : "") + (y ? "&e_cap_size=" + y : "") + (E ? "&e_rest_mode=" + E : "") + (f ? "&e_vid_quality=" + f : "") + (A ? "&e_title=" + $(A) : "") + (h != S ? "&e_toggle_ui=" + h : "") + (w ? "&e_cur_h=" + w : "") + (O ? "&e_cur_w=" + O : "") + (T ? "&e_client=" + T : "") + (D ? "&e_partner=" + D : "")
                    }(p, e, t || A.lang, o || A.accent, A.components, A.width, A.height, A.scroll, A.backgroundColor, A.linkColor, A.titleColor, A.captionColor, A.markerColor, A.queryColor, A.captionSize, A.restrictionMode, A.videoQuality, A.title, A.toggleUI, A.autoStart, A.panelsBackgroundColor, A.textColor, A.keywordColor, A.client, E, i),
                    l = A.height && 0 < Number(A.height) && "inner" != A.scroll ? "" : "scrolling='no'",
                    s = 0 < (n & (M | G | H)),
                    c = "<div style='display:none;" + (s ? "border: 1px solid #bec3e4" : "") + "' class='ygPanel'>" + (s ? function(e) {
                        var t = "<div style='font-size: 20px;padding: 4px;background-color: #3e4571;color: white;" + (0 < (e & M) ? "cursor: move" : "") + "'>&nbsp;\n";
                        0 < (e & H) && (t += "<span title='close widget' style='cursor:hand;cursor:pointer;float: right;color: #b9b9b9;margin-left:5px;line-height: 23px;font-size:30px' onclick='YG.close(\"" + p + "\")'>&times</span>");
                        0 < (e & G) && (t += "<span title='Show/hide widget' style='cursor:hand;cursor:pointer;float: right;color: #b9b9b9;margin-left:5px;line-height: 23px;' onclick='YG.toggle(\"" + p + "\")'>&#9776</span>   ");
                        return t += "</div>"
                    }(n) : "") + "<div class='ygContentEx' style='display:flex;'><div style='flex-grow: 0;margin-right:5px;display:none' class='plc_left'></div><div style='flex-grow: 1' class='ygContent'><div style='display:flex;flex-direction:column;align-items:center'><div style='margin-bottom:5px;display:none' class='plc_top'></div><iframe allow='autoplay' id='" + y + "' class='ygFrame'" + l + " style='" + a + "'  src='" + r + "'></iframe><div style='margin-top:5px;display:none' class='plc_bottom'></div></div></div><div style='flex-grow: 0;margin-left:5px;display:none' class='plc_right'></div></div></div>";
                h("div", null, "ygProgress", "padding:12px;border: 1px solid lightgrey;font-size:18px;font-style: italic", "Loading Youglish...");
                c = h("div", p, 0 < (n & M) ? "ygContainer ygDraggable" : "ygContainer", "background-color:white;z-index:999999", "<div class='ygProgress' style='padding:12px;border: 1px solid lightgrey;font-size:18px;font-style: italic'>Loading Youglish...</div>\n" + c), document.getElementById(p).outerHTML = c, 0 < (n & M) && ("undefined" == typeof DragModule ? x.onDragModuleReady = function(e) { e.registerAll() } : DragModule.registerAll()), null
            }
            var d, g, u;
            ! function() {
                w && clearTimeout(w);
                w = setTimeout(I, 5e3)
            }()
        }

        function d(e, t, o) { var i = ""; return i = o == q.TOP || o == q.BOTTOM ? e.replace(j, "horizontal") : e.replace(j, "vertical"), t && t.code_type == z.STYLE && (i = "<div style='" + t.code + "'>" + i + "</div>"), t && t.code_type == z.CLS && (i = "<div class='" + t.code + "'>" + i + "</div>"), i }

        function g(e, t, o, i) {
            var n = s.ygAds[e];
            n = (n = n || s.ygAds[0]) || J;
            var a = s.ygAds[e];
            a && a.code_type == z.ELEMENT || (a = s.ygAds[0]) && a.code_type == z.ELEMENT || (a = J), Number(n.responsive) && (t.style.width = i + "px"), n.type == F.ADSENSE ? (t.innerHTML = d(a.code, n, e), (adsbygoogle = x.adsbygoogle || []).push({})) : t.innerHTML = d(a.code, n, e)
        }

        function u(e, t, o, i) { "function" == typeof onYouglishDisplayAd && onYouglishDisplayAd(p, e, t, i) }

        function b(e, t) {
            var o = -1;
            if (e == q.LEFT || e == q.RIGHT) {
                var i = q.LEFT | q.RIGHT,
                    n = document.getElementById(p).offsetWidth;
                if ((o = Math.floor(n * (Q / 100))) < X && (t & i) == i && e == q.LEFT) {
                    var a = 2 * Q;
                    50 < a && (a = 50), o = Math.floor(n * (a / 100))
                }
            } else o = R().offsetWidth;
            return X <= o ? o : -1
        }

        function m() { C(), ee(R(), { source: "youglish", action: P_ACTION.PLAY }) }

        function _() { ee(R(), { source: "youglish", action: P_ACTION.PAUSE }) }
        A.query && c(A.query, A.lang, A.accent), 0 < (Number(A.components) & M) && !W && (W = !0, function() {
            var e = document.createElement("script");
            e.async = !0, e.src = "https://youglish.com/public/emb/ext_min.js";
            var t = document.getElementsByTagName("script")[0];
            t.parentNode.insertBefore(e, t)
        }());
        var v = 1;

        function T(e, t) {
            if (n[e])
                for (var o = 0; o < n[e].length; o++) n[e][o](t)
        }

        function N(e, t) { void 0 === n[e] && (n[e] = []), n[e].push(t) }

        function C() { R().style.display = "block" }

        function R() { return document.getElementById(y) }
        var w, O, P = !1;

        function I() { T("onError", { wid: p, action: W_ACTION.ERROR, code: K.TIMEOUT }) }
        return i.broadcast = T, i.addEventListener = N, i.removeEventListener = function(e, t) {
            if (n[e])
                for (var o = 0; o < n[e].length; o++)
                    if (n[e][o] === t) { n[e].splice(o, 1); break }
        }, i.fetch = c, i.search = function(e, t, o) { console.log("The method 'search' is deprecated. Use 'fetch' instead."), c(e, null, t, o) }, i.replay = function() { C(), ee(R(), { source: "youglish", action: P_ACTION.REPLAY }) }, i.play = m, i.pause = _, i.previous = function() { C(), ee(R(), { source: "youglish", action: P_ACTION.PREV }) }, i.next = function() { C(), ee(R(), { source: "youglish", action: P_ACTION.NEXT }) }, i.move = function(e) { C(), ee(R(), { source: "youglish", action: P_ACTION.DELTA, delta: e }) }, i.getId = function() { return p }, i.resize = function(e, t, o) {
            var i = { source: "youglish", action: P_ACTION.SIZE },
                n = R();
            t && 0 < Number(t) && (n.style.height = t + "px", i.height = t), e && 0 < Number(e) && (n.style.width = e + "px", i.width = e), o && ee(n, i)
        }, i.toggle = function() {
            var e = document.getElementById(p).getElementsByClassName("ygContentEx")[0];
            null == e.style.display || "none" == e.style.display ? (e.style.display = "flex", m()) : (e.style.display = "none", _())
        }, i.close = function() { f = !1, document.getElementById(p).innerHTML = "" }, i.show = C, i.hide = function() { R().style.display = "none" }, i.display = function(e) {
            var t = document.getElementById(p),
                o = t.getElementsByClassName("ygPanel")[0];
            P && "block" == o.style.display || (t.getElementsByClassName("ygProgress")[0].style.display = "none", o.style.display = "block", !s || s.display != U.PARTNER && s.display != U.YG || function() {
                var e, t;
                t = s.display == U.YG ? (console.log("\nDisplaying YG ads..."), s.ygLocations && (e = s.ygLocations), e = e || (B ? l : V), g) : (console.log("\nDisplaying PARTNER ads..."), e = l, u);
                for (var o = 1; o <= 8; o *= 2)
                    if (0 < (e & o)) {
                        var i = Z(o);
                        console.log("...draw " + i + " ad unit ...?");
                        var n = document.getElementById(p).getElementsByClassName(i)[0],
                            a = b(o, e); - 1 != a ? (n.style.display = "block", console.log("-----\x3e YES, sugWidth: " + a), t(o, n, e, a)) : console.log("-----\x3e NOP, not enough space")
                    }
                console.log("done.\n")
            }(), P = void 0 === e || e)
        }, i.serverHit = function() { w && (clearTimeout(w), w = null) }, i.setAdsLocation = function(e) { E = 0 < ((l = e) & q.BOTTOM) || 0 < (e & q.RIGHT), f = !1 }, i.setAdConfig = function(e, t, o, i) {
            var n, a;
            s = { display: Number(e), ygAds: t, ygLocations: Number(o) }, i && document.getElementById(r || p).appendChild((n = "<div style='position:relative'><div style='margin-top: 15px;float: right;color: grey;font-size: 11px;font-style: oblique;padding: 2px 5px;border-top: 1px solid #d4d4d4'> Powered by <a style='text-decoration: none;color:#337ab7' href='https://youglish.com'>Youglish.com</a></div><div style='clear: both;float:none'></div></div>", (a = document.createElement("div")).innerHTML = n, a.firstChild))
        }, i.setContainerId = function(e) { r = e }, i.setReady = function(e) { f = e }, i.onSpeedUpdated = function(e) { v = e }, i.getSpeed = function() { return v }, i.setSpeed = function(e) { ee(R(), { source: "youglish", action: P_ACTION.SETPLAYERSPEED, speed: e }) }, L[(O = i).getId()] = O, Y.push(O), i
    }
    return t || (t = !0, x.addEventListener("message", o, !1)), r(), e.PlayerState = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }, e.Error = K, e.AdLocations = q, e.setParnterKey = function(e) { D = e }, e.parsePage = r, e.getWidget = function(e) { return L[e] }, e.getWidgets = function() { return Y }, e.Widget = s, e.toggle = function(e) { L[e].toggle() }, e.close = function(e) { L[e].close() }, e.setAdWidthRatio = function(e) { 10 < e && e <= 50 && (Q = e) }, e.setMinAdWidth = function(e) { X = e }, e
}(window);
"function" == typeof onYouglishAPIReady && onYouglishAPIReady();


export default YG