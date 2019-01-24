/*---------------------------------------------------------------------------*/
/* innovaphone.appwebsocket.Connection.js                                    */
/* A client for connecting to the innovaphone PBX                            */
/*---------------------------------------------------------------------------*/

/*
 * Copyright (C) 2015 innovaphone AG
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of the copyright holder nor the names of
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
 * OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
 * OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/// <reference path="../common/innovaphone.common.crypto.js" />

var innovaphone = innovaphone || {};
innovaphone.appwebsocket = innovaphone.appwebsocket || {};
innovaphone.appwebsocket.Connection = innovaphone.appwebsocket.Connection || function (url, app, password, domain, fonconnected, fonmessage, fonerror, fonclosed, fgetlogin) {
    console.log("AppWebsocket(" + app + ") " + url);
    var TIMEOUT_MIN = 1000,
        TIMEOUT_MAX = 8000,
        states = { "CONNECT": 1, "OPENED": 2, "LOGIN2": 3, "CONNECTED": 4, "CLOSED": 5 };

    var instance = this,
        url = url,
        ws = null,
        state = states.CONNECT,
        user = null,
        dn = null,
        sessionKey = null,
        unique = 0,
        timeout = TIMEOUT_MIN;

    this.checkBuild = false;
    window.addEventListener('message', onpostmessage);
    window.addEventListener('beforeunload', function () { close() });

    function onopen() {
        timeout = TIMEOUT_MIN;
        console.log("opened " + ws.url + " location " + location.href);
        state = states.OPENED;
        if (instance.checkBuild) {
            send({ mt: "CheckBuild", url: location.href });
        }
        send({ mt: "AppChallenge" });
    }

    function onmessage(message) {
        var obj = JSON.parse(message.data);
        if (obj && obj.mt) {
            console.log("recv: " + message.data);
            switch (obj.mt) {
                case "AppChallengeResult":
                    if (obj.sysClient) password = "";
                    if (password || obj.sysClient) passwordLogin(obj.challenge);
                    else if (window.self == window.top) adminLogin(obj.challenge);
                    else if (fgetlogin) fgetlogin(app, obj.challenge);
                    else window.parent.postMessage(JSON.stringify({ mt: "getLogin", app: app, challenge: obj.challenge }), "*");
                    break;
                case "AppLoginResult":
                    if (obj.ok) {
                        state = states.CONNECTED;
                        instance.onconnected(domain, user, dn, obj.domain);
                    }
                    break;
                case "CheckBuildResult":
                    if (instance.checkBuild) {
                        if (obj.url) {
                            if (applicationCache) try { applicationCache.update(); } catch (err) { };
                            location.href = obj.url;
                        }
                        break;
                    }
                default:
                    if (state == states.CONNECTED) {
                        for (var i = 0; i < srcs.length; i++) {
                            if (srcs[i].src == obj.src) {
                                srcs[i].onmessage(obj);
                                return;
                            }
                        }

                        for (var i = 0; i < apis.length; ++i) {
                            if (apis[i].name == obj.api) {
                                apis[i].api.onmessage(obj);
                                return;
                            }
                        }

                        instance.onmessage(obj);
                    }
                    break;
            }

        }
    }

    function onpostmessage(e) {
        if (JSON && e.data && typeof e.data == "string") {
            var obj = JSON.parse(e.data);
            if (obj.mt && obj.mt == "Login") {
                console.log(app + ": AppLogin(" + obj.sip + "@" + obj.domain + ", guid=" + obj.guid + ", dn=" + obj.dn + ", app=" + obj.app + ")");
                if (app == obj.pbxObj) login(obj);
                else delete obj.key;
                instance.logindata = obj;
            }
            else {
                instance.onFromPBX(obj);
            }
        }
    }

    function login(obj) {
        user = obj.sip;
        domain = obj.domain;
        dn = obj.dn;
        sessionKey = obj.key;
        delete obj.key;
        send({ mt: "AppLogin", app: obj.app, domain: obj.domain, sip: obj.sip, guid: obj.guid, dn: obj.dn, info: obj.info, digest: obj.digest, pbxObj: app });
    }

    function passwordLogin(challenge) {
        var obj = {};
        obj.app = app;
        obj.sip = app;
        obj.domain = domain ? domain : "";
        obj.lang = "en";
        obj.guid = "00000000000000000000000000000000";
        obj.dn = "Admin";
        obj.digest = innovaphone.common.crypto.sha256(app + ":" + obj.domain + ":" + obj.sip + ":" + obj.guid + ":" + obj.dn + ":" + challenge + ":" + password);
        obj.key = innovaphone.common.crypto.sha256("innovaphoneAppSessionKey:" + challenge + ":" + password);
        login(obj);
    }

    function adminLogin(challenge) {
        innovaphone.lib1.loadObjectScript("web/common/innovaphone.common.crypto", function () {
            var inp = document.createElement("input");
            inp.type = "password";
            inp.setAttribute("style", "position: absolute; left: 10px; top: 10px");
            inp.onkeypress = function (event) { if (event.keyCode == 13) click(); };
            document.body.appendChild(inp);
            var button = document.createElement("button");
            button.setAttribute("style", "position: absolute; left: 10px; top: 50px");
            button.innerHTML = "Login";
            document.body.appendChild(button);
            button.addEventListener('click', click);
            inp.focus();

            function click() {
                var obj = new Object();
                obj.app = app;
                obj.sip = app;
                obj.domain = "";
                obj.lang = "en";
                obj.guid = "00000000000000000000000000000000";
                obj.dn = "Admin";
                obj.digest = innovaphone.common.crypto.sha256(app + ":" + obj.domain + ":" + obj.sip + ":" + obj.guid + ":" + obj.dn + ":" + challenge + ":" + inp.value);
                obj.key = innovaphone.common.crypto.sha256("innovaphoneAppSessionKey:" + challenge + ":" + inp.value);
                login(obj);
                inp.remove();
                button.remove();
            }
        });
    }

    function onerror(error) {
        console.log("error");
        ws.onclose = null;
        ws.onmessage = null;
        ws.onopen = null;
        ws.onerror = null;
        close("WEBSOCKET_ERROR");
    }

    function onclose() {
        if (console) console.log("closed");
        ws = null;
        if (state != states.CLOSED) close("REMOTE_CLOSE");
    }

    // general control functions
    function connect() {
        state = states.CONNECT;
        if (ws) ws.close();
        ws = new WebSocket(url);
        ws.onopen = onopen;
        ws.onmessage = onmessage;
        ws.onerror = onerror;
        ws.onclose = onclose;
    }

    function close(error) {
        if (state != states.CLOSED) {
            console.log("closing");
            state = states.CLOSED;
            if (ws) ws.close();
            ws = null;
            if (error) {
                if (instance.onerror(error)) error = null;
            }
            else instance.onclosed();
        }
        if (error) {
            console.log("reconnect in " + timeout + "ms");
            window.setTimeout(function () { if (state == states.CLOSED) connect(); }, timeout);
            if (timeout < TIMEOUT_MAX) timeout *= 2;
        }
    }

    function encrypt(seed, data) {
        return innovaphone.common.crypto.str2hex(innovaphone.common.crypto.rc4(seed + ":" + sessionKey, data));
    }

    function decrypt(seed, data) {
        return innovaphone.common.crypto.rc4(seed + ":" + sessionKey, innovaphone.common.crypto.hex2str(data));
    }

    function hash(seed, data) {
        return innovaphone.common.crypto.sha256(seed + ":" + sessionKey + ":" + data);
    }

    // outgoing messages
    // session
    function send(obj) {
        var messageJSON = JSON.stringify(obj);
        if (ws) {
            console.log("send: " + messageJSON);
            ws.send(messageJSON);
        }
        else {
            console.log("discard: " + messageJSON);
        }
    }

    // public interface
    this.connect = function () {
        if (state == states.CLOSED) connect();
    }
    this.send = function (message) {
        if (state == states.CONNECTED) send(message);
    }
    this.sendSrc = function (message, result, obj) {
        var src = new instance.Src(function (m) {
            src.close();
            result(m, src.obj);
        });
        src.obj = obj;
        src.send(message);
    }
    this.close = function (error) {
        close(error);
    }
    this.login = function (obj) {
        login(obj);
    }
    this.toPBX = function (obj) {
        window.parent.postMessage(JSON.stringify(obj), "*");
    }
    this.dn = function () {
        return dn;
    }
    this.user = function () {
        return user;
    }
    this.obj = function () {
        return app;
    }
    this.connected = function () {
        return state == states.CONNECTED;
    }
    this.encrypt = encrypt;
    this.decrypt = decrypt;
    this.hash = hash;

    // public event handlers
    // session
    this.onconnected = fonconnected ? fonconnected : function () { };
    this.onmessage = fonmessage ? fonmessage : function (message) { };
    this.onerror = fonerror ? fonerror : function (error) { };
    this.onclosed = fonclosed ? fonclosed : function () { };
    this.onFromPBX = function () { };

    // start
    connect();

    var srcs = [];
    this.src = function (src) {
        if (!src) src = "src" + unique++;
        this.src = src;
        this.onmessage = null;
        this.send = function (message) {
            message.src = src;
            send(message)
        }
        this.close = function () {
            srcs.splice(srcs.indexOf(this), 1);
        }
        for (var i = 0; i < srcs.length; i++) {
            if (srcs[i].src == src) {
                console.log("duplicate src " + src);
                srcs.splice(i, 1);
            }
        }
        srcs.push(this);

        this.encrypt = encrypt;
        this.decrypt = decrypt;
        this.hash = hash;
    }

    this.Src = function (on, src) {
        if (!src) src = "src" + unique++;
        this.src = src;
        this.onmessage = on;
        this.send = function (message) {
            message.src = src;
            send(message)
        }
        this.close = function () {
            srcs.splice(srcs.indexOf(this), 1);
        }
        for (var i = 0; i < srcs.length; i++) {
            if (srcs[i].src == src) {
                console.log("duplicate src " + src);
                srcs.splice(i, 1);
            }
        }
        srcs.push(this);

        this.encrypt = encrypt;
        this.decrypt = decrypt;
        this.hash = hash;
    }

    var apis = [];
    this.registerApi = function (obj, name) {
        for (var i = 0; i < apis.length; ++i) {
            if (apis[i].name == name) {
                console.log("registerApi(): duplicate api " + name);
                return;
            }
        }

        apis.push({ name: name, api: obj });
    }
};
