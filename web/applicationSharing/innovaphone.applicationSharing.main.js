/*---------------------------------------------------------------------------*/
/* innovaphone.applicationSharing.Main.js                                    */
/* A library for adding WebRTC call functionality to websites using the      */
/* innovaphone PBX                                                           */
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

/// <reference path="innovaphone.applicationSharing.main.js" />

var innovaphone = innovaphone || {};
innovaphone.applicationSharing = innovaphone.applicationSharing || {};
innovaphone.applicationSharing.PathPrefix = innovaphone.applicationSharing.PathPrefix || "";
innovaphone.applicationSharing.main = innovaphone.applicationSharing.main || (function () {

    var MESSAGE_TYPE = 0
    var SESSION_ID = 1
    var INDEX_X = 2
    var INDEX_Y = 3
    var BLOCK_VERSION = 4
    var BLOCK_UPDATE = 5
    var POS_X = 6
    var POS_Y = 7
    var DIM_X = 8
    var DIM_Y = 9
    var COMPRESSION_TYPE = 10
    var INFO_SEQUENCE = 2

    // Messages
    var CREATE_SESSION = 0
    var CREATE_SESSION_ACK = 1
    var DELETE_SESSION = 2
    var DELETE_SESSION_ACK = 3
    var UPDATE_SESSION = 4
    var UPDATE_SESSION_ACK = 5
    var IMAGE_MESSAGE  = 6 
    var MOUSE_CURSOR   = 8 
    var MOUSE_MOVE = 9
    var INFO_MESSAGE = 10
    var INFO_MESSAGE_ACK = 11

    var BLOCK_MSG = 0;
    var BLOCK_MSG_256 = 1;
    var PLAIN_MSG = 2;
    var PNG_COMP = 0;
    var JPEG_COMP = 1;

    var SEND_MOUSE_TYPE = 12;

    // Constructors
    _Receiver = function (remoteName) {
        var session_ids = [];
        var remote_name = remoteName;
        var onUpdateParticipant = null;
        var onDeleteParticipant = null;
        var guid = createGuid();

        function createGuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        this.setUpdateParticipantFunction = function (updateFunc) {
            onUpdateParticipant = updateFunc;
        }

        this.updateParticipant = function (updateFunc) {
            if (onUpdateParticipant != null && remote_name != null) onUpdateParticipant(guid, remote_name);
        }

        this.setDeleteParticipantFunction = function (deleteFunc) {
            onDeleteParticipant = deleteFunc;
        }

        this.deleteParticipant = function (deleteFunc) {
            if (onDeleteParticipant != null && remote_name != null) onDeleteParticipant(guid, remote_name);
        }

        this.getRemoteName = function () {
            return remote_name;
        }

        this.getReceiverGuid = function () {
            return guid;
        }

        this.getSessionId = function () {
            return session_ids[0];
        }

        this.addSessionId = function (sessionId) {
            for (var i = 0; i < session_ids.length; i++) {
                if (session_ids[i] == sessionId) {
                    console.log('Receiver: session=' + sessionId + ' already in the list');
                    return;
                }
            }
            session_ids.push(sessionId);
        }

        this.hasSessionId = function (sessionId) {
            for (var i = 0; i < session_ids.length; i++) {
                if (session_ids[i] == sessionId) return 1;
            }
            return 0;
        }

        this.removeSessionId = function (sessionId) {
            for (var i = 0; i < session_ids.length; i++) {
                if (session_ids[i] == sessionId) {
                    session_ids.splice(i, 1);
                    console.log('Receiver: remove session ' + sessionId);
                    return 1;
                }
            }
            return 0;
        }

        this.numSessions = function () {
            return session_ids.length;
        }
    }

    _Session = function (sessionId, appName, onUpdateApp, onResizeApp, onRemoveApp, onRemoteControl, onRequestRemoteControl, getNewInfoSeq, queueInfoMsg, dataChannel) {
        var image_data = null;
        var img_h = 0;
        var img_w = 0;
        var have_control = false;
        var token = 0;
        var scale_image = true;
        var m_offset_x = 0;
        var m_offset_y = 0;
        var last_mouse_x = 0;
        var last_mouse_y = 0;
        var session_id = sessionId;
        var app_name = appName;
        var container_id = null;
        var onUpdateApp = onUpdateApp;
        var onResizeApp = onResizeApp;
        var onRemoveApp = onRemoveApp;
        var onRemoteControl = onRemoteControl;
        var onRequestRemoteControl = onRequestRemoteControl;
        var getNewInfoSeq = getNewInfoSeq;
        var queueInfoMsg = queueInfoMsg;
        var data_channel = dataChannel;
        var full_screen = false;
        var full_screen_width = 0;
        var full_screen_height = 0;
        var cursor_offset = false;

        var CURSOR_IDC_ARROW = 0;
        var CURSOR_IDC_HAND = 1;
        var CURSOR_IDC_WAIT = 2;
        var CURSOR_IDC_APPSTARTING = 3;
        var CURSOR_IDC_IBEAM = 4;
        var CURSOR_IDC_CROSS = 5;
        var CURSOR_IDC_HELP = 6;
        var CURSOR_IDC_NO = 7;
        var CURSOR_IDC_SIZEALL = 8;
        var CURSOR_IDC_SIZENESW = 9;
        var CURSOR_IDC_SIZENS = 10;
        var CURSOR_IDC_SIZENWSE = 11;
        var CURSOR_IDC_SIZEWE = 12;
        var CURSOR_IDC_UPARROW = 13;
        var CURSOR_IDC_VSPLIT = 14;
        var CURSOR_IDC_HSPLIT = 15;
        var CURSOR_IDC_H1SPLIT = 16;
        var CURSOR_IDC_H2SPLIT = 17;
        var CURSOR_IDC_V2SPLIT = 18;
        var cursors_file = innovaphone.applicationSharing.PathPrefix + "cursors.png";

        var VK_BACK = 0x8, VK_TAB = 0x9, VK_CLEAR = 0xC, VK_RETURN = 0xD, VK_SPACE = 0x20;
        var VK_SHIFT = 0x10, VK_CONTROL = 0x11, VK_MENU = 0x12;
        var VK_CAPITAL = 0x14;
        var VK_ESCAPE = 0x1B;
        var VK_LEFT = 0x25, VK_TOP = 0x26, VK_RIGHT = 0x27, VK_BOTTOM = 0x28;
        var VK_PRIOR = 0x21, VK_NEXT = 0x22;
        var VK_END = 0x23, VK_HOME = 0x24;
        var VK_0 = 0x30, VK_1 = 0x31, VK_2 = 0x32, VK_3 = 0x33, VK_4 = 0x34;
        var VK_5 = 0x35, VK_6 = 0x36, VK_7 = 0x37, VK_8 = 0x38, VK_9 = 0x39;
        var VK_A = 0x41, VK_Z = 0x5A;
        var VK_a = 0x61, VK_z = 0x7A;
        var VK_LWIN = 0x5B;

        var keyCodes = [
             0, 1, 2, 3, 4, 5, 6, 7, VK_BACK, VK_TAB,
            10, 11, VK_CLEAR, VK_RETURN, 14, 15, VK_SHIFT, VK_CONTROL, VK_MENU, 19,
            VK_CAPITAL, 21, 22, 23, 24, 25, 26, VK_ESCAPE, 28, 29,
            30, 31, VK_SPACE, VK_PRIOR, VK_NEXT, VK_END, VK_HOME, VK_LEFT, VK_TOP, VK_RIGHT,
            VK_BOTTOM, 41, 42, 43, 44, 45, 46, 47,
            VK_0, VK_1, VK_2, VK_3, VK_4, VK_5, VK_6, VK_7, VK_8, VK_9];

        var canvas_id = new Array(3);
        var ctx_id = new Array(3);
        // canvasIds[0] just creates images for the different apps received
        // canvasIds[1] contains the app being displayed in original size
        // canvasIds[2] contains the app being displayed in original or adjusted size (what the user sees) 
        for (var k = 0; k < 3; k++) {
            canvas_id[k] = document.createElement("canvas");
            canvas_id[k].setAttribute("id", "webrtc.sharing." + sessionId);
            ctx_id[k] = canvas_id[k].getContext("2d");
        }

        mouse_element = document.createElement("div");
        mouse_element.setAttribute("style", "position:absolute; visibility:hidden; background: url('" + cursors_file + "') no-repeat; background-position: 0px -120px; width:24px; height:24px; ");
        mouse_type = -1;

        var last_key_defined = 0x39;
        var is_shift_down = false;
        var is_ctrl_down = false;

        function getWidth() {
            return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || document.body.offsetWidth;
        }

        function getHeight() {
            return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || document.body.offsetHeight;
        }

        function textToBin(text) {
            var arrayMsg = new ArrayBuffer(text.length);
            var dmsg = new Uint8Array(arrayMsg);
            for (var i = 0; i < text.length; i++) {
                dmsg[i] = text[i].charCodeAt();
            }
            return arrayMsg;
        }

        function mousewheel_l(e) {
            if (!have_control) return;
            //console.log('mousewheel_l');

            if (!e) var e = window.event;
            if (mouseWheel(e) == false) {
                e.stopPropagation();
                e.preventDefault();
                e.cancelBubble = false;
            }
        }

        function mousewheel_a(e) {
            if (!have_control) return;
            //console.log('mousewheel_a');

            if (!e) var e = window.event;
            if (mouseWheel(e) == false) {
                e.returnValue = false;
                e.cancelBubble = true;
            }
        }

        function keyup_l(e) {
            if (!have_control) return;
            //console.log('keyup_l');

            if (!e) var e = window.event;
            if (keyUp(e) == false) {
                e.stopPropagation();
                e.preventDefault();
                e.cancelBubble = false;
            }
        }

        function keyup_a(e) {
            if (!have_control) return;
            //console.log('keyup_a');

            if (!e) var e = window.event;
            if (keyUp(e) == false) {
                e.returnValue = false;
                e.cancelBubble = true;
            }
        }

        function keydown_l(e) {
            if (!have_control) return;
            //console.log('keydown_l');

            if (!e) var e = window.event;
            if (keyDown(e) == false) {
                e.stopPropagation();
                e.preventDefault();
                e.cancelBubble = false;
            }
        }

        function keydown_a(e) {
            if (!have_control) return;
            //console.log('keydown_a');

            if (!e) var e = window.event;
            if (keyDown(e) == false) {
                e.returnValue = false;
                e.cancelBubble = true;
            }
        }

        function keypress_l(e) {
            if (!have_control) return;
            //console.log('keypress_l');

            if (!e) var e = window.event;
            if (keyPress(e, 'keypress_l') == false) {
                e.stopPropagation();
                e.preventDefault();
                e.cancelBubble = false;
            }
        }

        function keypress_a(e) {
            if (!have_control) return;
            //console.log('keypress_a');

            if (!e) var e = window.event;
            if (keyPress(e, 'keypress_a') == false) {
                e.returnValue = false;
                e.cancelBubble = true;
            }
        }

        function onMouseMove(x, y, rect) {
            if ((last_mouse_x == x) && (last_mouse_y == y)) {
                return null;
            }

            last_mouse_x = x;
            last_mouse_y = y;

            var new_x = x;
            var new_y = y;

            if (container_id) {
                var display_w = full_screen_width, display_h = full_screen_height;
                if (img_w && img_h && full_screen_width && full_screen_height) {
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, full_screen_width);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > full_screen_height) {
                            display_w = (display_w * full_screen_height) / display_h;
                            display_h = full_screen_height;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, full_screen_height);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > full_screen_width) {
                            display_h = (display_h * full_screen_width) / display_w;
                            display_w = full_screen_width;
                        }
                    }

                    var offX = 0, offY = 35;
                    if (full_screen_width > display_w) offX = (full_screen_width - display_w) >> 1;
                    if (display_w) {
                        x -= offX;
                        x = (img_w * x) / display_w;
                    }
                    if (display_h) {
                        y -= offY;
                        y = (img_h * y) / display_h;
                    }

                    new_x = (0 | x);
                    new_y = (0 | y);
                }
            }
            else {
                new_x -= rect.left;
                new_y -= rect.top;
            }

            var coord = new Array(2);
            coord[0] = new_x;
            coord[1] = new_y;

            return coord;
        }

        function mouseMoveHandle(e) {
            if (!have_control || !full_screen) return;
            var rect = canvas_id[2].getBoundingClientRect();
            console.log('mouseMoveHandle ' + e.clientY + ' x= ' + e.clientX);
            console.log('rect ' + rect.top + ' b= ' + rect.bottom + ' l= ' + rect.left + ' r= ' + rect.right);
            if (e.clientY < rect.top || e.clientX < rect.left) return;
            if (e.clientY > rect.bottom || e.clientX > rect.right) return;

            var coord = onMouseMove(e.clientX, e.clientY, rect);
            if (coord) {
                var arrayInfoMsg = new ArrayBuffer(10);
                var dmsg = new Uint8Array(arrayInfoMsg);

                dmsg[0] = MOUSE_MOVE;
                dmsg[1] = session_id + 128;
                dmsg[2] = dmsg[3] = dmsg[4] = dmsg[5] = 0;
                dmsg[6] = (coord[0] >> 8) & 0xff;
                dmsg[7] = coord[0] & 0xff;
                dmsg[8] = (coord[1] >> 8) & 0xff;
                dmsg[9] = coord[1] & 0xff;

                if (data_channel) data_channel.send(arrayInfoMsg);
            }
        }

        function onMouseUp(button, x, y, rect) {
            var mouse_click;
            if (button == 0) {
                mouse_click = 193;
            }
            else if (button == 2) {
                mouse_click = 196;
            }
            else return null;

            last_mouse_x = x;
            last_mouse_y = y;

            var new_x = x;
            var new_y = y;

            if (container_id) {
                var display_w = full_screen_width, display_h = full_screen_height;
                if (img_w && img_h && full_screen_width && full_screen_height) {
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, full_screen_width);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > full_screen_height) {
                            display_w = (display_w * full_screen_height) / display_h;
                            display_h = full_screen_height;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, full_screen_height);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > full_screen_width) {
                            display_h = (display_h * full_screen_width) / display_w;
                            display_w = full_screen_width;
                        }
                    }

                    var offX = 0, offY = 35;
                    if (full_screen_width > display_w) offX = (full_screen_width - display_w) >> 1;
                    if (display_w) {
                        x -= offX;
                        x = (img_w * x) / display_w;
                    }
                    if (display_h) {
                        y -= offY;
                        y = (img_h * y) / display_h;
                    }

                    new_x = (0 | x);
                    new_y = (0 | y);
                }
            }
            else {
                new_x -= rect.left;
                new_y -= rect.top;
            }

            var coord = new Array(3);
            coord[0] = new_x;
            coord[1] = new_y;
            coord[2] = mouse_click;

            return coord;
        }

        function mouseUpHandle(e) {
            if (!have_control || !full_screen) return;
            //log('mouseUpHandle');

            var evt = e;
            var rect = canvas_id[2].getBoundingClientRect();
            if (evt.clientY < rect.top || evt.clientX < rect.left) return;
            if (evt.clientY > rect.bottom || evt.clientX > rect.right) return;

            var coord = onMouseUp(evt.button, evt.clientX, evt.clientY, rect);
            if (coord) {
                var jsonMsg;
                if (coord[2] == 193) { //LBUTTONUP
                    jsonMsg = '{"mt":"mouse","x":' + coord[0] + ',"y":' + coord[1] + ',"leftUp":1}';
                }
                else if (coord[2] == 196) { //RBUTTONUP
                    jsonMsg = '{"mt":"mouse","x":' + coord[0] + ',"y":' + coord[1] + ',"rightUp":1}';
                }
                var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
                var dmsg = new Uint8Array(arrayInfoMsg);

                dmsg[0] = INFO_MESSAGE;
                dmsg[1] = session_id + 128;
                dmsg[2] = getNewInfoSeq();
                dmsg[3] = 5 + jsonMsg.length + 1;
                dmsg[4] = 0x6; // Info(Mouse)
                dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                var off = 9;
                for (var i = 0; i < jsonMsg.length; i++) {
                    dmsg[off++] = jsonMsg[i].charCodeAt();
                }
                dmsg[off] = 0;
                var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
                if (data_channel) data_channel.send(arrayInfoMsg);
                queueInfoMsg(infoMsg);
            }
        }

        function onMouseDown(button, x, y, rect) {
            var mouse_click;
            if (button == 0) {
                mouse_click = 192;
            }
            else if (button == 2) {
                mouse_click = 195;
            }
            else return null;

            last_mouse_x = x;
            last_mouse_y = y;

            var new_x = x;
            var new_y = y;
            if (container_id) {
                var display_w = full_screen_width, display_h = full_screen_height;
                if (img_w && img_h && full_screen_width && full_screen_height) {
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, full_screen_width);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > full_screen_height) {
                            display_w = (display_w * full_screen_height) / display_h;
                            display_h = full_screen_height;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, full_screen_height);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > full_screen_width) {
                            display_h = (display_h * full_screen_width) / display_w;
                            display_w = full_screen_width;
                        }
                    }

                    var offX = 0, offY = 35;
                    if (full_screen_width > display_w) offX = (full_screen_width - display_w) >> 1;
                    if (display_w) {
                        x -= offX;
                        x = (img_w * x) / display_w;
                    }
                    if (display_h) {
                        y -= offY;
                        y = (img_h * y) / display_h;
                    }

                    new_x = (0 | x);
                    new_y = (0 | y);
                }
            }
            else {
                new_x -= rect.left;
                new_y -= rect.top;
            }

            var coord = new Array(3);
            coord[0] = new_x;
            coord[1] = new_y;
            coord[2] = mouse_click;

            return coord;
        }

        function mouseDownHandle(e) {
            if (!have_control) return;
            //log('mouseDownHandle');

            var evt = e;
            //writeToScreen("mouseDownHandle " + e.button + ' ' + e.clientX + ' ' + e.clientY);
            var rect = canvas_id[2].getBoundingClientRect();
            if (evt.clientY < rect.top || evt.clientX < rect.left) return;
            if (evt.clientY > rect.bottom || evt.clientX > rect.right) return;

            var coord = onMouseDown(evt.button, evt.clientX, evt.clientY, rect);
            if (coord) {
                var jsonMsg;
                if (coord[2] == 192) { //LBUTTONDOWN
                    jsonMsg = '{"mt":"mouse","x":' + coord[0] + ',"y":' + coord[1] + ',"leftDown":1}';
                }
                else if (coord[2] == 195) { //RBUTTONDOWN
                    jsonMsg = '{"mt":"mouse","x":' + coord[0] + ',"y":' + coord[1] + ',"rightDown":1}';
                }
                var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
                var dmsg = new Uint8Array(arrayInfoMsg);

                dmsg[0] = INFO_MESSAGE;
                dmsg[1] = session_id + 128;
                dmsg[2] = getNewInfoSeq();
                dmsg[3] = 5 + jsonMsg.length + 1;
                dmsg[4] = 0x6; // Info(Mouse)
                dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                var off = 9;
                for (var i = 0; i < jsonMsg.length; i++) {
                    dmsg[off++] = jsonMsg[i].charCodeAt();
                }
                dmsg[off] = 0;
                var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
                if (data_channel) data_channel.send(arrayInfoMsg);
                queueInfoMsg(infoMsg);
            }
        }

        function mouseDoubleClickHandle(e) {
            if (!have_control) return;
            //log('mouseDoubleClickHandle');

            var evt = e;
            var rect = canvas_id[2].getBoundingClientRect();
            if (evt.clientY < rect.top || evt.clientX < rect.left) return;
            if (evt.clientY > rect.bottom || evt.clientX > rect.right) return;

            //onMouseDoubleClick(evt.button, evt.clientX, evt.clientY, scale_image, img_w, img_h, rect);
        }

        function domMouseScroll(e) {
            if (!have_control) return;
            //log('domMouseScroll ' + e.wheelDelta);

            var jsonMsg = '{"mt":"mouse","wheel":1}';
            var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            dmsg[0] = INFO_MESSAGE;
            dmsg[1] = session_id + 128;
            dmsg[2] = getNewInfoSeq();
            dmsg[3] = 5 + jsonMsg.length + 1;
            dmsg[4] = 0x6; // Info(Mouse)
            dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
            var off = 9;
            for (var i = 0; i < jsonMsg.length; i++) {
                dmsg[off++] = jsonMsg[i].charCodeAt();
            }
            dmsg[off] = 0;
            var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
            if (data_channel) data_channel.send(arrayInfoMsg);
            queueInfoMsg(infoMsg);

            e.stopPropagation();
            e.preventDefault();
            e.cancelBubble = false;
        }

        function mouseWheel(e) {
            var jsonMsg = '{"mt":"mouse","wheel":1}';
            var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            dmsg[0] = INFO_MESSAGE;
            dmsg[1] = session_id + 128;
            dmsg[2] = getNewInfoSeq();
            dmsg[3] = 5 + jsonMsg.length + 1;
            dmsg[4] = 0x6; // Info(Mouse)
            dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
            var off = 9;
            for (var i = 0; i < jsonMsg.length; i++) {
                dmsg[off++] = jsonMsg[i].charCodeAt();
            }
            dmsg[off] = 0;
            var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
            if (data_channel) data_channel.send(arrayInfoMsg);
            queueInfoMsg(infoMsg);

            return false;
        }

        function onKeyUp(keyCode, shiftKey, altKey, ctrlKey) {
            //log("onKeyUp " + keyCode + ' ' + shiftKey + ' ' + altKey + ' ' + ctrlKey);
            var ret = Array(3);

            if ((keyCode >= VK_A && keyCode <= VK_Z) || (keyCode >= VK_a && keyCode <= VK_z)) {
                ret[0] = 0;
                return ret;
            }
            else { //if (keyCode < lastKeyDefined) {
                ret[0] = 1;
                ret[1] = 0;
                if (!shiftKey && !altKey && !ctrlKey) {   // if special key set, ignore it
                    ret[1] = 203;
                    ret[2] = keyCode;
                }
                else if (((keyCode == VK_SHIFT) && ctrlKey && is_shift_down) || ((keyCode == VK_CONTROL) && shiftKey && is_ctrl_down)) {
                    ret[1] = 203;
                    ret[2] = keyCode;
                }
                is_shift_down = shiftKey;
                is_ctrl_down = ctrlKey;
            }
            return ret;
        }

        function keyUp(e, type) {
            //log("IE-onKeyUp " + e.charCode + ' ' + e.which + ' ' + e.keyCode + ' ' + e.shiftKey + ' ' + e.altKey + ' ' + e.ctrlKey);
            var ret = onKeyUp(e.keyCode, e.shiftKey, e.altKey, e.ctrlKey);
            if (ret[0] == 0) {
                return false;
            }
            var jsonMsg = '{"mt":"keyboard","keyUp":' + ret[2] + '}';
            var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            dmsg[0] = INFO_MESSAGE;
            dmsg[1] = session_id + 128;
            dmsg[2] = getNewInfoSeq();
            dmsg[3] = 5 + jsonMsg.length + 1;
            dmsg[4] = 0x6; // Info(Mouse)
            dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
            var off = 9;
            for (var i = 0; i < jsonMsg.length; i++) {
                dmsg[off++] = jsonMsg[i].charCodeAt();
            }
            dmsg[off] = 0;
            var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
            if (data_channel) data_channel.send(arrayInfoMsg);
            queueInfoMsg(infoMsg);

            return true;
        }

        function onKeyDown(keyCode, shiftKey, altKey, ctrlKey) {
            //log("onKeyDown " + keyCode + ' ' + shiftKey + ' ' + altKey + ' ' + ctrlKey);
            var ret = Array(3);

            if ((keyCode >= VK_A && keyCode <= VK_Z) || (keyCode >= VK_a && keyCode <= VK_z)) {   // Ctrl + X
                if (shiftKey) keyCode += 256;
                if (ctrlKey) keyCode += 512;
                if (altKey) keyCode += 1024;
                if (altKey || ctrlKey) {
                    ret[0] = 0;
                    ret[1] = 200;
                    ret[2] = keyCode;
                    return ret;
                }
            }
            else { //if (keyCode < lastKeyDefined) {
                ret[0] = 0;
                ret[1] = 0;
                if (keyCode != VK_SHIFT && keyCode != VK_CONTROL && keyCode != VK_MENU) {
                    if (shiftKey) keyCode += 256;
                    if (ctrlKey) keyCode += 512;
                    if (altKey) keyCode += 1024;
                    if (keyCode > 256) {
                        ret[1] = 202;
                        ret[2] = keyCode;
                        is_shift_down = shiftKey;
                        is_ctrl_down = ctrlKey;
                    }
                    else {
                        ret[1] = 201;
                        ret[2] = keyCode;
                    }
                }
                return ret;
            }
            ret[0] = 1;
            return ret;
        }

        function keyDown(e) {
            //log("KeyDown " + e.charCode + ' ' + e.which + ' ' + e.keyCode + ' ' + e.shiftKey + ' ' + e.altKey + ' ' + e.ctrlKey);
            var ret = onKeyDown(e.keyCode, e.shiftKey, e.altKey, e.ctrlKey);
            if (ret[0] == 0) {
                if (ret[1]) {
                    var jsonMsg = '{"mt":"keyboard","keyDown":' + ret[2] + '}';
                    var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
                    var dmsg = new Uint8Array(arrayInfoMsg);

                    dmsg[0] = INFO_MESSAGE;
                    dmsg[1] = session_id + 128;
                    dmsg[2] = getNewInfoSeq();
                    dmsg[3] = 5 + jsonMsg.length + 1;
                    dmsg[4] = 0x6; // Info(Mouse)
                    dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                    var off = 9;
                    for (var i = 0; i < jsonMsg.length; i++) {
                        dmsg[off++] = jsonMsg[i].charCodeAt();
                    }
                    dmsg[off] = 0;
                    var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
                    if (data_channel) data_channel.send(arrayInfoMsg);
                    queueInfoMsg(infoMsg);
                }
                return false;
            }
            return true;
        }

        function onKeyPressed(keyCode, shiftKey, altKey, ctrlKey) {
            var ret = Array(3);

            //log("onKeyPressed " + keyCode + ' ' + shiftKey + ' ' + altKey + ' ' + ctrlKey);

            ret[0] = 1;
            ret[1] = 0;
            if (keyCode >= VK_A && keyCode <= VK_z) {
                if (shiftKey) keyCode += 256;
                if (ctrlKey) keyCode += 512;
                if (altKey) keyCode += 1024;
                ret[0] = 0;
                ret[1] = 200;
                ret[2] = keyCode;
            }
            return ret;
        }

        function keyPress(e, type) {
            //log("KeyPressed t=" + type + ' ' + e.charCode + ' ' + e.which + ' ' + e.keyCode + ' ' + e.shiftKey + ' ' + e.altKey + ' ' + e.ctrlKey);
            if (type == 'keypress_l') {
                var ch = e.keyCode || e.which;
                var ret = onKeyPressed(e.keyCode || e.which, e.shiftKey, e.altKey, e.ctrlKey);
            }
            else {
                var ch = e.keyCode;
                var ret = onKeyPressed(e.keyCode, e.shiftKey, e.altKey, e.ctrlKey);
            }
            if (ret[0] == 0) {
                if (ret[1]) {
                    var jsonMsg = '{"mt":"keyboard","keyPress":' + ret[2] + ',"keyCode":' + ch + '}';
                    var arrayInfoMsg = new ArrayBuffer(9 + jsonMsg.length + 1);
                    var dmsg = new Uint8Array(arrayInfoMsg);

                    dmsg[0] = INFO_MESSAGE;
                    dmsg[1] = session_id + 128;
                    dmsg[2] = getNewInfoSeq();
                    dmsg[3] = 5 + jsonMsg.length + 1;
                    dmsg[4] = 0x6; // Info(Mouse)
                    dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                    var off = 9;
                    for (var i = 0; i < jsonMsg.length; i++) {
                        dmsg[off++] = jsonMsg[i].charCodeAt();
                    }
                    dmsg[off] = 0;
                    var infoMsg = new _InfoMessage(arrayInfoMsg, session_id, dmsg[2]);
                    if (data_channel) data_channel.send(arrayInfoMsg);
                    queueInfoMsg(infoMsg);
                }
                return false;
            }
            return true;
        }

        this.fitToElement = function () {
            var c_w, c_h;

            if (full_screen) {
                c_w = full_screen_width;
                c_h = full_screen_height;
            }
            else {
                if (container_id.style.width != "100%") c_w = parseInt(container_id.style.width || container_id.offsetWidth, 10);
                else c_w = parseInt(container_id.offsetWidth, 10);

                if (container_id.style.height != "100%") c_h = parseInt(container_id.style.height || container_id.offsetHeight, 10);
                else c_h = parseInt(container_id.offsetHeight, 10);
            }

            scale_image = !scale_image;
            if(scale_image) {
                var display_w = c_w, display_h = c_h;
                if (img_w && img_h && c_w && c_h) {
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, c_w);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > c_h) {
                            display_w = (display_w * c_h) / display_h;
                            display_h = c_h;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, c_h);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > c_w) {
                            display_h = (display_h * c_w) / display_w;
                            display_w = c_w;
                        }
                    }
                    display_w = Math.floor(display_w);
                    display_h = Math.floor(display_h);
                    canvas_id[2].width = display_w;
                    canvas_id[2].height = display_h;
                    canvas_id[2].style.width = display_w + "px";
                    canvas_id[2].style.height = display_h + "px";
                    ctx_id[2].drawImage(canvas_id[1], 0, 0, display_w, display_h);
                }
                else {
                    console.log('AppSharing-fitToElement: dimensions not defined ' + img_w + ',' + img_h + ' ' + c_w + ',' + c_h);
                }
            }
            else {
                ctx_id[2].drawImage(canvas_id[1], 0, 0, c_w, c_h);
            }
        }

        this.adjustImageToCanvas = function (width, height) {
            var c_w, c_h;

            if (full_screen) {
                full_screen_width = width;
                full_screen_height = height-35;
                c_w = full_screen_width;
                c_h = full_screen_height;
            }
            else {
                if (container_id.style.width != "100%") c_w = parseInt(container_id.style.width || container_id.offsetWidth, 10);
                else c_w = parseInt(container_id.offsetWidth, 10);

                if (container_id.style.height != "100%") c_h = parseInt(container_id.style.height || container_id.offsetHeight, 10);
                else c_h = parseInt(container_id.offsetHeight, 10);
            }

            var display_w = c_w, display_h = c_h;
            if (img_w && img_h && c_w && c_h) {
                if (img_w >= img_h) {
                    display_w = Math.min(img_w, c_w);
                    display_h = (img_h * display_w) / img_w;
                    if (display_h > c_h) {
                        display_w = (display_w * c_h) / display_h;
                        display_h = c_h;
                    }
                }
                else {
                    display_h = Math.min(img_h, c_h);
                    display_w = (img_w * display_h) / img_h;
                    if (display_w > c_w) {
                        display_h = (display_h * c_w) / display_w;
                        display_w = c_w;
                    }
                }
                display_w = Math.floor(display_w);
                display_h = Math.floor(display_h);
                canvas_id[2].width = display_w;
                canvas_id[2].height = display_h;
                canvas_id[2].style.width = display_w + "px";
                canvas_id[2].style.height = display_h + "px";
                ctx_id[2].drawImage(canvas_id[1], 0, 0, display_w, display_h);
            }
            else {
                console.log('AppSharing-adjustImageToCanvas: dimensions not defined ' + img_w + ',' + img_h + ' ' + c_w + ',' + c_h);
            }
        }

        this.updateSession = function (width, height) {
            if ((width != img_w) || (height != img_h)) {
                console.log('AppSharing: dimensions changed(' + session_id + ') ' + width + 'x' + height + ' old ' + img_w + 'x' + img_h);
                if (image_data) image_data = null;
                image_data = ctx_id[0].createImageData(width, height);
                img_w = width;
                img_h = height;

                canvas_id[0].width = width;
                canvas_id[0].height = height;
                canvas_id[0].style.width = width + "px";
                canvas_id[0].style.height = height + "px";

                canvas_id[1].width = width;
                canvas_id[1].height = height;
                canvas_id[1].style.width = width + "px";
                canvas_id[1].style.height = height + "px";

                var c_w, c_h;

                if (full_screen) {
                    c_w = full_screen_width;
                    c_h = full_screen_height;
                }
                else {
                    if (container_id.style.width != "100%") c_w = parseInt(container_id.style.width || container_id.offsetWidth, 10);
                    else c_w = parseInt(container_id.offsetWidth, 10);

                    if (container_id.style.height != "100%") c_h = parseInt(container_id.style.height || container_id.offsetHeight, 10);
                    else c_h = parseInt(container_id.offsetHeight, 10);
                }

                if (container_id) {
                    var display_w = c_w, display_h = c_h;
                    if (img_w && img_h && c_w && c_h) {
                        if (img_w >= img_h) {
                            display_w = Math.min(img_w, c_w);
                            display_h = (img_h * display_w) / img_w;
                            if (display_h > c_h) {
                                display_w = (display_w * c_h) / display_h;
                                display_h = c_h;
                            }
                        }
                        else {
                            display_h = Math.min(img_h, c_h);
                            display_w = (img_w * display_h) / img_h;
                            if (display_w > c_w) {
                                display_h = (display_h * c_w) / display_w;
                                display_w = c_w;
                            }
                        }
                        display_w = Math.floor(display_w);
                        display_h = Math.floor(display_h);
                        canvas_id[2].width = display_w;
                        canvas_id[2].height = display_h;
                        canvas_id[2].style.width = display_w + "px";
                        canvas_id[2].style.height = display_h + "px";
                        ctx_id[2].drawImage(canvas_id[1], 0, 0, display_w, display_h);
                    }
                    else {
                        console.log('AppSharing: dimensions not defined ' + img_w + ',' + img_h + ' ' + c_w + ',' + c_h);
                    }
                }
                else {
                    canvas_id[2].width = c_w;
                    canvas_id[2].height = c_h;
                    canvas_id[2].style.width = c_w + "px";
                    canvas_id[2].style.height = c_h + "px";
                }
                if (onResizeApp) onResizeApp();
            }
        }

        this.processImageMessage = function (blob, length, params) {
            readPngCb(blob, params);
        }

        this.processMouseMessage = function (params) {
            //console.log("mouse cursor pos " + params[2] + "x" + params[3] + " mouse:" + params[4] + " x:" + m_offset_x + " y:" + m_offset_y);
            if (have_control) {
                var myCanvas = null;
                if (container_id) {
                    for (i = 0; i < container_id.childNodes.length; i++) {
                        if (container_id.childNodes[i].nodeName == 'CANVAS' || container_id.childNodes[i].nodeName == 'canvas') {
                            myCanvas = container_id.childNodes[i];
                            break;
                        }
                    }
                }
                if (myCanvas) {
                    if (mouse_type != params[4]) {
                        switch (params[4]) {
                            case CURSOR_IDC_ARROW:
                                myCanvas.style["cursor"] = "default";
                                break;
                            case CURSOR_IDC_HAND:
                                myCanvas.style["cursor"] = "pointer";
                                break;
                            case CURSOR_IDC_WAIT:
                                myCanvas.style["cursor"] = "wait";
                                break;
                            case CURSOR_IDC_APPSTARTING:
                                myCanvas.style["cursor"] = "progress";
                                break;
                            case CURSOR_IDC_IBEAM:
                                myCanvas.style["cursor"] = "text";
                                break;
                            case CURSOR_IDC_CROSS:
                                myCanvas.style["cursor"] = "crosshair";
                                break;
                            case CURSOR_IDC_HELP:
                                myCanvas.style["cursor"] = "help";
                                break;
                            case CURSOR_IDC_NO:
                                myCanvas.style["cursor"] = "not-allowed";
                                break;
                            case CURSOR_IDC_SIZEALL:
                                myCanvas.style["cursor"] = "move";
                                break;
                            case CURSOR_IDC_SIZENESW:
                                myCanvas.style["cursor"] = "sw-resize";
                                break;
                            case CURSOR_IDC_SIZENS:
                                myCanvas.style["cursor"] = "n-resize";
                                break;
                            case CURSOR_IDC_SIZENWSE:
                                myCanvas.style["cursor"] = "nw-resize";
                                break;
                            case CURSOR_IDC_SIZEWE:
                                myCanvas.style["cursor"] = "w-resize";
                                break;
                            case CURSOR_IDC_UPARROW:
                                myCanvas.style["cursor"] = "default";
                                break;
                            case CURSOR_IDC_VSPLIT:
                                myCanvas.style["cursor"] = "row-resize";
                                break;
                            case CURSOR_IDC_HSPLIT:
                                myCanvas.style["cursor"] = "col-resize";
                                break;
                            case CURSOR_IDC_H1SPLIT:
                                myCanvas.style["cursor"] = "col-resize";
                                break;
                            case CURSOR_IDC_H2SPLIT:
                                myCanvas.style["cursor"] = "col-resize";
                                break;
                            case CURSOR_IDC_V2SPLIT:
                                myCanvas.style["cursor"] = "row-resize";
                                break;
                            default:
                                myCanvas.style["cursor"] = "default";
                                break;
                        }
                        mouse_type = params[4];
                    }
                }
            }
            else if (mouse_element != null) {
                if (mouse_type != params[4]) {
                    switch (params[4]) {
                        case CURSOR_IDC_ARROW:
                            m_offset_x = 0;
                            m_offset_y = 0;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -120px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_HAND:
                            m_offset_x = cursor_offset ? -8 : -13;
                            m_offset_y = 0;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -24px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_WAIT:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -96px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_APPSTARTING:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -48px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_IBEAM:
                            m_offset_x = cursor_offset ? -8 : -13;
                            m_offset_y = -8;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -72px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_CROSS:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -144px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_HELP:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -24px -120px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_NO:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -24px -48px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_SIZEALL:
                            m_offset_x = -5;
                            m_offset_y = -5;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_SIZEWE:
                            m_offset_x = cursor_offset ? -15 : -20;
                            m_offset_y = -18;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -24px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_SIZENS:
                            m_offset_x = -cursor_offset ? -15 : -20;
                            m_offset_y = -18;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -48px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_SIZENESW:
                            m_offset_x = cursor_offset ? -15 : -20;
                            m_offset_y = -18;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -72px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_SIZENWSE:
                            m_offset_x = cursor_offset ? -15 : -20;
                            m_offset_y = -18;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -96px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_UPARROW:
                            m_offset_x = cursor_offset ? -15 : -20;
                            m_offset_y = -18;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -120px 0px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_VSPLIT:
                            m_offset_x = 8;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -48px -72px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_HSPLIT:
                            m_offset_x = 5;
                            m_offset_y = 9;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -72px -72px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_H1SPLIT:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -72px -72px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_H2SPLIT:
                            m_offset_x = 5;
                            m_offset_y = 3;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -72px -72px; width:24px; height:24px;");
                            break;
                        case CURSOR_IDC_V2SPLIT:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: -48px -72px; width:24px; height:24px;");
                            break;
                        default:
                            m_offset_x = 5;
                            m_offset_y = 6;
                            mouse_element.setAttribute("style", "position:absolute; visibility:visible; background: url('" + cursors_file + "') no-repeat; background-position: 0px -120px; width:24px; height:24px;");
                            break;
                    }
                    mouse_type = params[4];
                }
                var scale_x = 1, scale_y = 1;
                if (img_w && img_h && full_screen_width && full_screen_height) {
                    var display_w, display_h;
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, full_screen_width);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > full_screen_height) {
                            display_w = (display_w * full_screen_height) / display_h;
                            display_h = full_screen_height;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, full_screen_height);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > full_screen_width) {
                            display_h = (display_h * full_screen_width) / display_w;
                            display_w = full_screen_width;
                        }
                    }
                    scale_x = display_w / img_w;
                    scale_y = display_h / img_h;
                }
                var offX = 0;
                if (full_screen_width > display_w) offX = (full_screen_width - display_w) >> 1;
                mouse_element.style.left = (((params[2] + m_offset_x) * scale_x) + offX) + "px";
                mouse_element.style.top = (((params[3] + m_offset_y) * scale_y) + 32) + "px";  // 32 is the header size for the appName
            }
        }

        function redrawCanvas(width, height) {
            var c_w, c_h;

            if (full_screen) {
                c_w = full_screen_width;
                c_h = full_screen_height;
            }
            else {
                if (container_id.style.width != "100%") c_w = parseInt(container_id.style.width || container_id.offsetWidth, 10);
                else c_w = parseInt(container_id.offsetWidth, 10);

                if (container_id.style.height != "100%") c_h = parseInt(container_id.style.height || container_id.offsetHeight, 10);
                else c_h = parseInt(container_id.offsetHeight, 10);
            }

            ctx_id[1].putImageData(image_data, 0, 0);

            if (container_id) {
                var display_w = c_w, display_h = c_h;
                if (img_w && img_h && c_w && c_h) {
                    if (img_w >= img_h) {
                        display_w = Math.min(img_w, c_w);
                        display_h = (img_h * display_w) / img_w;
                        if (display_h > c_h) {
                            display_w = (display_w * c_h) / display_h;
                            display_h = c_h;
                        }
                    }
                    else {
                        display_h = Math.min(img_h, c_h);
                        display_w = (img_w * display_h) / img_h;
                        if (display_w > c_w) {
                            display_h = (display_h * c_w) / display_w;
                            display_w = c_w;
                        }
                    }
                    display_w = Math.floor(display_w);
                    display_h = Math.floor(display_h);
                    canvas_id[2].width = display_w;
                    canvas_id[2].height = display_h;
                    canvas_id[2].style.width = display_w + "px";
                    canvas_id[2].style.height = display_h + "px";
                    ctx_id[2].drawImage(canvas_id[1], 0, 0, display_w, display_h);
                }
                else {
                    console.log('AppSharing: dimensions not defined ' + img_w + ',' + img_h + ' ' + c_w + ',' + c_h);
                }
            }
            else {
                ctx_id[2].drawImage(canvas_id[1], 0, 0, c_w, c_h);
            }
        }

        function readPngCb(blob, params) {
            var rx_session = params[SESSION_ID];
            var img_data = image_data.data;
            var imageRes = blob;
            var index = 11;  // ImageMessage header
            if (params[COMPRESSION_TYPE] == PNG_COMP) { // PNG
                if (imageRes[index + 1] != 80 || imageRes[index + 2] != 78 || imageRes[index + 3] != 71) {   // PNG
                    console.log('AppSharing: Unknown PNG format...' + imageRes[index + 1] + imageRes[index + 2] + imageRes[index + 3]);
                }
                else {
                    var png = new innovaphone.applicationSharing.PNG(imageRes, index);
                    var pixels = png.decode();
                    var k = 0;
                    var offset = (params[3] * img_w + params[2]) * 128 * 4; // y * width + x 
                    offset += (params[7] * img_w + params[6]) * 4;          // inside the block
                    for (var i = 0; i < params[9]; i++) {
                        var n_offset = offset + (i * img_w * 4);
                        for (var j = 0; j < (params[8] * 4) ; j += 4) {
                            // i+3 is alpha (the fourth element)
                            img_data[n_offset + j + 0] = pixels[k++];
                            img_data[n_offset + j + 1] = pixels[k++];
                            img_data[n_offset + j + 2] = pixels[k++];
                            img_data[n_offset + j + 3] = pixels[k++];        // alpha
                        }
                    }
                }
            }
            else {
                var j = new innovaphone.applicationSharing.JpegImage();
                j.parse(imageRes, index);
                var offset = (params[3] * img_w + params[2]) * 128 * 4; // y * width + x 
                offset += (params[7] * img_w + params[6]) * 4;          // inside the block
                j.copyToImageDataOffset(image_data, offset, params[8], params[9]);
            }

            //console.log("AppSharing: END_BIT_IMG rx " + rx_session + " params[8] " + params[8]);

            redrawCanvas(img_w, img_h);
        }

        this.getContainerWidth = function () {
            if (container_id) parseInt(container_id.style.width || container_id.offsetWidth, 10);
            else return getWidth();
        }

        this.getContainerHeight = function () {
            if (container_id) parseInt(container_id.style.height || container_id.offsetHeight, 10);
            else return getHeight();
        }

        this.getAppName = function () {
            return app_name;
        }

        this.getSessionId = function () {
            return session_id;
        }

        this.setFullScreenMode = function(container, width, height, mode) {
            full_screen = mode;
            if (full_screen) {
                full_screen_width = width;
                full_screen_height = height - 35;
                mouse_element = document.createElement("div");
                mouse_element.setAttribute("style", "position:absolute; visibility:hidden; background: url('" + cursors_file + "') no-repeat; background-position: 0px -120px; width:24px; height:24px; ");
                mouse_type = -1;
                if(!have_control) container.appendChild(mouse_element);
                this.adjustImageToCanvas(width, height);
            }
            else {
                full_screen_width = 0;
                full_screen_height = 0;
                if (mouse_element) {
                    if (!have_control) container_id.removeChild(mouse_element);
                    mouse_element = null;
                }
                mouse_type = -1;
                scale_image = true;
            }
            this.setContainer(container);
        }

        this.setContainer = function (container) {
            console.log('AppSharing: [' + session_id + '] new=' + container + ' old=' + container_id);
            if (container != null) {
                if (container == container_id) {  // after a renegotiation container remains equal...
                    var myCanvas = null;
                    for (i = 0; i < container_id.childNodes.length; i++) {
                        if (container_id.childNodes[i].nodeName == 'CANVAS' || container_id.childNodes[i].nodeName == 'canvas') {
                            myCanvas = container_id.childNodes[i];
                            break;
                        }
                    }
                    if (myCanvas != null) {
                        container_id.removeChild(myCanvas);
                        console.log('AppSharing: set: canvas removed for container!');
                    }
                }
                container_id = container;
                if (full_screen) {
                    canvas_id[2].setAttribute("style", "margin-right: auto; margin-left: auto; display: block; visibility: visible;");
                    console.log("AppSharing: init application sharing display dim = " + full_screen_width + "x" + full_screen_height + ' scale = ' + scale_image);
                }
                else {
                    canvas_id[2].setAttribute("style", "margin-right: auto; margin-left: auto; display: block; visibility: visible; width: 100%; height: 100px;");
                    console.log("AppSharing: init application sharing display dim = " + (container_id.style.width || container_id.offsetWidth) + "x" + (container_id.style.height || container_id.offsetHeight) + ' scale = ' + scale_image);
                }
                container_id.appendChild(canvas_id[2]);
            }
        }

        this.getContainer = function () {
            return container_id;
        }

        this.haveControl = function () {
            return have_control;
        }

        this.setDataChannel = function (dataChannel) {
            data_channel = dataChannel;
        }

        this.setRemoveFunction = function (removeFunc) {
            onRemoveApp = removeFunc;
        }

        this.setRemoteControlFunction = function (remoteControlFunc) {
            onRemoteControl = remoteControlFunc;
        }

        this.setRemoteControl = function (session_token, control) {
            token = session_token;
            have_control = control;
            if (have_control) {
                if (container_id) {
                    for (i = 0; i < container_id.childNodes.length; i++) {
                        if (container_id.childNodes[i].nodeName == 'CANVAS' || container_id.childNodes[i].nodeName == 'canvas') {
                            var myCanvas = container_id.childNodes[i];
                            myCanvas.style["cursor"] = "default";
                            break;
                        }
                    }
                }
                var doc = canvas_id[2].ownerDocument;
                var win = null;
                if (doc) {
                    win = doc.defaultView || doc.parentWindow;
                }
                else if (container_id) {
                    doc = container_id.container.ownerDocument;
                    if (doc) {
                        win = doc.defaultView || doc.parentWindow;
                    }
                }
                if (canvas_id[2].addEventListener) {
                    console.log('AppSharing: control addEventListener');
                    canvas_id[2].addEventListener("mousedown", mouseDownHandle, false);
                    canvas_id[2].addEventListener("mousemove", mouseMoveHandle, false);
                    canvas_id[2].addEventListener("mouseup", mouseUpHandle, false);
                    canvas_id[2].addEventListener("dblclick", mouseDoubleClickHandle, false);
                    canvas_id[2].addEventListener("DOMMouseScroll", domMouseScroll, false);
                    canvas_id[2].addEventListener('mousewheel', mousewheel_l, false);
                    if (win) {
                        win.addEventListener('keypress', keypress_l, false);
                        win.addEventListener('keydown', keydown_l, false);
                        win.addEventListener('keyup', keyup_l, false);
                    }
                }
                else if (canvas_id[2].attachEvent) {
                    console.log('AppSharing: control attachEvent');
                    canvas_id[2].attachEvent("onmousedown", mouseDownHandle, false);
                    canvas_id[2].attachEvent("onmousemove", mouseMoveHandle, false);
                    canvas_id[2].attachEvent("onmouseup", mouseUpHandle, false);
                    canvas_id[2].attachEvent("ondblclick", mouseDoubleClickHandle, false);
                    canvas_id[2].attachEvent('mousewheel', mousewheel_a, false);
                    canvas_id[2].attachEvent('onmousewheel', mousewheel_a, false);
                    if (win) {
                        win.attachEvent('keypress', keypress_a, false);
                        win.attachEvent('keydown', keydown_a, false);
                        win.attachEvent('keyup', keyup_a, false);
                        win.attachEvent('onkeypress', keypress_a, false);
                        win.attachEvent('onkeydown', keydown_a, false);
                        win.attachEvent('onkeyup', keyup_a, false);
                    }
                }
                mouse_type = -1;
                if (container_id && mouse_element && mouse_element.parentNode == container_id) container_id.removeChild(mouse_element);
            }
            else {
                console.log('AppSharing: control removed');

                if (container_id) {
                    for (i = 0; i < container_id.childNodes.length; i++) {
                        if (container_id.childNodes[i].nodeName == 'CANVAS' || container_id.childNodes[i].nodeName == 'canvas') {
                            var myCanvas = container_id.childNodes[i];
                            myCanvas.style["cursor"] = "default";
                            break;
                        }
                    }
                }
                var doc = canvas_id[2].ownerDocument;
                var win = null;
                if (doc) {
                    win = doc.defaultView || doc.parentWindow;
                }
                else if (container_id) {
                    doc = container_id.ownerDocument;
                    if (doc) {
                        win = doc.defaultView || doc.parentWindow;
                    }
                }
                if (canvas_id[2].removeEventListener) {
                    canvas_id[2].removeEventListener("mousedown", mouseDownHandle, false);
                    canvas_id[2].removeEventListener("mousemove", mouseMoveHandle, false);
                    canvas_id[2].removeEventListener("mouseup", mouseUpHandle, false);
                    canvas_id[2].removeEventListener("dblclick", mouseDoubleClickHandle, false);
                    canvas_id[2].removeEventListener("DOMMouseScroll", domMouseScroll, false);
                    canvas_id[2].removeEventListener('mousewheel', mousewheel_l, false);
                    if (win) {
                        win.removeEventListener('keypress', keypress_l, false);
                        win.removeEventListener('keydown', keydown_l, false);
                        win.removeEventListener('keyup', keyup_l, false);
                    }
                }
                else if (canvas_id[2].removeEvent) {
                    canvas_id[2].removeEvent("onmousedown", mouseDownHandle, false);
                    canvas_id[2].removeEvent("onmousemove", mouseMoveHandle, false);
                    canvas_id[2].removeEvent("onmouseup", mouseUpHandle, false);
                    canvas_id[2].removeEvent("ondblclick", mouseDoubleClickHandle, false);
                    canvas_id[2].removeEvent('onmousewheel', mousewheel_a, false);
                    canvas_id[2].removeEvent('mousewheel', mousewheel_a, false);
                    if (win) {
                        win.removeEvent('keypress', keypress_a, false);
                        win.removeEvent('keydown', keydown_a, false);
                        win.removeEvent('keyup', keyup_a, false);
                        win.removeEvent('onkeypress', keypress_a, false);
                        win.removeEvent('onkeydown', keydown_a, false);
                        win.removeEvent('onkeyup', keyup_a, false);
                    }
                }
                mouse_type = -1;
                if (container_id && mouse_element) container_id.appendChild(mouse_element);
            }
            if (onRemoteControl) onRemoteControl(session_id, have_control);
        }

        this.setRequestRemoteControlFunction = function (requestRemoteControlFunc) {
            onRequestRemoteControl = requestRemoteControlFunc;
        }

        this.setUpdateFunction = function (updateFunc) {
            onUpdateApp = updateFunc;
            if (app_name != null) onUpdateApp(session_id, app_name);
        }

        this.setResizeFunction = function (resizeFunc) {
            onResizeApp = resizeFunc;
        }
    }

    _InfoMessage = function(msg, sessionId, seq) {
        var msg = msg;
        var sessionId = sessionId;
        var seq = seq;
        var cnt = 0;

        this.get_msg = function () {
            return msg;
        }
        this.get_session_id = function () {
            return sessionId;
        }
        this.get_seq = function () {
            return seq;
        }
        this.increase_counter = function() {
            cnt++; 
        }
        this.get_counter = function() { 
            return cnt; 
        }
    }

    // Constructor
    function _AppSharing(displayname) {
        var sessions = []; // list of _Session 
        var receivers = []; // list of _Receivers
        var infoMessages = []; // list of _InfoMessage

        var infoTimer = null;
        var sender_name = displayname;
        var infoMsgSeq = 0;
        var dataChannel = null;
        var onCreateApp = null;
        var onUpdateApp = null;
        var onRemoveApp = null;
        var onResizeApp = null;  
        var onRemoteControl = null;
        var onUpdateParticipant = null;
        var onDeleteParticipant = null;
        var onRequestRemoteControl = null;
        var num_packets_rx = 0;

        function getNewInfoSeq() {
            return infoMsgSeq++;
        }

        function queueInfoMsg(infoMsg) {
            infoMessages.push(infoMsg);
            if (infoTimer == null) infoTimer = setInterval(processInfoMessages, 20);
        }

        function sharingEvent(type, data) {
            //console.log('sharingEvent ' + type + ' data ' + data);
            switch (type) {
                case 'init':
                    init(null);
                    jsonChannel = data;
                    break;
                case 'setAppContainer':
                    setAppContainer(data);
                    break;
                case 'setFullScreenMode':
                    setFullScreenMode(data);
                    break;
                case 'newParticipantCallback':
                    onUpdateParticipant = data;
                    if (onUpdateParticipant) {
                        for (var i = 0; i < receivers.length; i++) {
                            receivers[i].setUpdateParticipantFunction(onUpdateParticipant);
                        }
                    }
                    break;
                case 'delParticipantCallback':
                    onDeleteParticipant = data;
                    if (onDeleteParticipant) {
                        for (var i = 0; i < receivers.length; i++) {
                            receivers[i].setDeleteParticipantFunction(onDeleteParticipant);
                        }
                    }
                    break;
                case 'updateAppCallback':
                    onUpdateApp = data;
                    if (onUpdateApp) {
                        for (var i = 0; i < sessions.length; i++) {
                            sessions[i].setUpdateFunction(onUpdateApp);
                        }
                    }
                    break;
                case 'createAppCallback':
                    onCreateApp = data;
                    if (onCreateApp) {
                        for (var i = 0; i < sessions.length; i++) {
                            onCreateApp(sessions[i].getSessionId(), sessions[i].getAppName());
                        }
                    }
                    break;
                case 'remoteControlCallback':
                    onRemoteControl = data;
                    if (onRemoteControl) {
                        for (var i = 0; i < sessions.length; i++) {
                            sessions[i].setRemoteControlFunction(onRemoteControl);
                        }
                    }
                    break;
                case 'onRequestRemoteControl':
                    onRequestRemoteControl = data;
                    if (onRequestRemoteControl) {
                        for (var i = 0; i < sessions.length; i++) {
                            sessions[i].setRequestRemoteControlFunction(onRequestRemoteControl);
                        }
                    }
                    break;
                case 'removeAppCallback':
                    onRemoveApp = data;
                    if (onRemoveApp) {
                        for (var i = 0; i < sessions.length; i++) {
                            sessions[i].setRemoveFunction(onRemoveApp);
                        }
                    }
                    break;
                case 'resizeAppCallback':
                    onResizeApp = data;
                    if (onResizeApp) {
                        for (var i = 0; i < sessions.length; i++) {
                            sessions[i].setResizeFunction(onResizeApp);
                        }
                    }
                    break;
                case 'setname':
                    setOwnName(data);
                    break;
                case 'onGiveControlToUser':
                    GiveControlToUser(data);
                    break;
                case 'onRemoveControlFromUser':
                    RemoveControlFromUser(data);
                    break;
                case 'fitToElement':
                    fitToElement(data);
                    break;
                case 'adjustImageToCanvas':
                    adjustImageToCanvas(data);
                    break;
                case 'requestControl':
                    RequestControlFromUser(data);
                    break;
                default:
                    console.log('AppSharing: unknown event received: ' + type);
            }
            //log('sharingEvent -> ' + type);
        }

        function setOwnName(data) {
            sender_name = data;
        }

        function GiveControlToUser(data) {
            var arrayInfoMsg = new ArrayBuffer(4 + 1 + 4 + sender_name.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            var receiver = receivers.find(function (r) { return r.getReceiverGuid() === data.id });
            if (receiver) {
                console.log('AppSharing: give control to ' + receiver.getRemoteName() + ' sessionId=' + receiver.getSessionId() + ' id=' + receiver.getReceiverGuid());

                dmsg[0] = INFO_MESSAGE;
                dmsg[1] = receiver.getSessionId();
                dmsg[2] = getNewInfoSeq();
                dmsg[3] = 1 + 4 + sender_name.length + 1;
                dmsg[4] = 0x2; // Info(GiveControl)
                dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                var off = 9;
                for (var i = 0; i < sender_name.length; i++) {
                    dmsg[off++] = sender_name[i].charCodeAt();
                }
                dmsg[off] = 0;
                var infoMsg = new _InfoMessage(arrayInfoMsg, receiver.getSessionId(), dmsg[2]);
                if (dataChannel) dataChannel.send(arrayInfoMsg);
                queueInfoMsg(infoMsg);
            }
        }

        function RemoveControlFromUser(data) {
            var arrayInfoMsg = new ArrayBuffer(4 + 1 + 4 + sender_name.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            var receiver = receivers.find(function (r) { return r.getReceiverGuid() === data.id });
            if (receiver) {
                console.log('AppSharing: remove control from ' + receiver.getRemoteName() + ' sessionId=' + receiver.getSessionId() + ' id=' + receiver.getReceiverGuid());

                dmsg[0] = INFO_MESSAGE;
                dmsg[1] = receiver.getSessionId();
                dmsg[2] = getNewInfoSeq();
                dmsg[3] = 1 + 4 + sender_name.length + 1;
                dmsg[4] = 0x3; // Info(TakeControl)
                dmsg[5] = dmsg[6] = dmsg[7] = dmsg[8] = 0;
                var off = 9;
                for (var i = 0; i < sender_name.length; i++) {
                    dmsg[off++] = sender_name[i].charCodeAt();
                }
                dmsg[off] = 0;
                var infoMsg = new _InfoMessage(arrayInfoMsg, receiver.getSessionId(), dmsg[2]);
                if (dataChannel) dataChannel.send(arrayInfoMsg);
                queueInfoMsg(infoMsg);
            }
        }

        function RequestControlFromUser(data) {
            var foundSession = -1;
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].getSessionId() == data.session) {
                    if (sessions[i].haveControl()) return;
                    foundSession = i;
                    break;
                }
            }
            if (foundSession < 0) return;

            var arrayInfoMsg = new ArrayBuffer(4 + 1 + sender_name.length + 1);
            var dmsg = new Uint8Array(arrayInfoMsg);

            dmsg[0] = INFO_MESSAGE;
            dmsg[1] = data.session+128;
            dmsg[2] = getNewInfoSeq();
            dmsg[3] = 1 + sender_name.length + 1;
            dmsg[4] = 0x4; // Info(RequestControl)
            var off = 5;
            for (var i = 0; i < sender_name.length; i++) {
                dmsg[off++] = sender_name[i].charCodeAt();
            }
            dmsg[off] = 0;
            var infoMsg = new _InfoMessage(arrayInfoMsg, data.session, dmsg[2]);
            if (dataChannel) dataChannel.send(arrayInfoMsg);
            queueInfoMsg(infoMsg);
        }

        function fitToElement(data) {
            console.log('AppSharing: fitToElement app=' + data.app + ' session=' + data.session + ' cont=' + data.container);
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].getSessionId() == data.session) {
                    sessions[i].fitToElement();
                    break;
                }
            }
        }

        function adjustImageToCanvas(data) {
            console.log('AppSharing: adjustImageToCanvas session = ' + data.session + ' app = ' + data.id);
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].getSessionId() == data.session) {
                    sessions[i].adjustImageToCanvas(data.width, data.height);
                    break;
                }
            }
        }

        function processInfoMessages() {
            console.log('AppSharing: processInfoMessages=' + infoMessages.length);
            while(infoMessages.length > 0) {
                infoMessages[0].increase_counter();
                if(infoMessages[0].get_counter() > 20) {
                    infoMessages.splice(0, 1);
                }
                else {
                    if(dataChannel) dataChannel.send(infoMessages[0].msg);
                    return;
                }
            }
            clearInterval(infoTimer);
            infoTimer = null;
        }

        // public
        var close = function () {
            console.log('AppSharing: Close app sharing containers=' + sessions.length + ' receivers=' + receivers.length + ' infoMessages=' + infoMessages.length);
            dataChannel = null;
            infoMsgSeq = 0;
            for (var i = 0; i < receivers.length; i++) {
                if (onDeleteParticipant) onDeleteParticipant(receivers[i].getReceiverGuid());
            }
            receivers = [];
            sessions = [];
            infoMessages = [];
            if (infoTimer != null) clearInterval(infoTimer);
            infoTimer = null;
        }

        var init = function (data_channel) {
            infoMsgSeq = 0;
            dataChannel = data_channel;
            for (var i = 0; i < sessions.length; i++) {
                sessions[i].setDataChannel(dataChannel);
            }
            if (dataChannel) console.log('AppSharing: Application Sharing initialised!');
            else console.log('AppSharing: Application Sharing initialised without dataChanel!');
        }

        var setFullScreenMode = function (data) {
            console.log('AppSharing: setFullScreenMode for session ' + data.session + " and container " + data.container + " mode " + data.mode);
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].getSessionId() == data.session) {
                    sessions[i].setFullScreenMode(data.container, data.width, data.height, data.mode);
                }
            }
        }

        var setAppContainer = function (data) {
            console.log('AppSharing: setAppContainer for session ' + data.session + " with id " + data.id + " and container " + data.container);
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].getSessionId() == data.session) {
                    if (data.container != null) sessions[i].setContainer(data.container);
                    else {
                        sessions.splice(i, 1);
                        console.log('AppSharing: application for session ' + data.session + " removed! sessions=" + sessions.length + " receivers=" + receivers.length);
                    }
                    break;
                }
            }
        }

        var recv = function (appData) {
            /*if (((num_packets_rx++) & 0x7f) == 0x40) {
                console.log('AppSharing: Data received:' + num_packets_rx);
            }*/
            if (appData instanceof ArrayBuffer) {
                processingNode(new Uint8Array(appData));
            }
        }

        var processingNode = function (uint8View) {
            if (uint8View[MESSAGE_TYPE] != IMAGE_MESSAGE && uint8View[MESSAGE_TYPE] != MOUSE_CURSOR) console.log('AppSharing: received from session=' + uint8View[SESSION_ID] + ' and msg=' + uint8View[MESSAGE_TYPE]);

            if (uint8View[MESSAGE_TYPE] == CREATE_SESSION) {
                var session = 0;
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                        session = 1;
                        break;
                    }
                }
                if (session == 0) {
                    var appInfo = null;
                    if (uint8View.length > 6) {
                        var encodedString = String.fromCharCode.apply(null, uint8View.subarray(6));
                        appInfo = JSON.parse(decodeURIComponent(escape(encodedString)));
                        console.log('AppSharing: received CREATE_SESSION appName=' + appInfo.name + ' desc=' + appInfo.description);
                    }
                    var session = new _Session(uint8View[SESSION_ID], (appInfo != null ? appInfo.name : null), onUpdateApp, onResizeApp, onRemoveApp, onRemoteControl, onRequestRemoteControl, getNewInfoSeq, queueInfoMsg, dataChannel);
                    sessions.push(session);
                    onCreateApp(uint8View[SESSION_ID], (appInfo != null ? appInfo.name : null));
                    session.updateSession((uint8View[2] << 8 | uint8View[3]), (uint8View[4] << 8 | uint8View[5]));
                }

                var arrayMsgS = new ArrayBuffer(2);
                var dmsg = new Uint8Array(arrayMsgS);
                dmsg[0] = CREATE_SESSION_ACK;
                dmsg[1] = uint8View[SESSION_ID] + 128;
                if (dataChannel) dataChannel.send(arrayMsgS);

                console.log('AppSharing: send INFO_MESSAGE:AddParticipant sender_name=' + sender_name);

                var arrayInfoMsg = new ArrayBuffer(5+sender_name.length+1);
                var dmsg = new Uint8Array(arrayInfoMsg);

                dmsg[0] = INFO_MESSAGE;
                dmsg[1] = uint8View[SESSION_ID]+128;
                dmsg[2] = infoMsgSeq++;
                dmsg[3] = 1 + sender_name.length + 1;
                dmsg[4] = 0x0; // Info(AddParticipant)
                var off = 5;
                for (var i = 0; i < sender_name.length; i++) {
                    dmsg[off++] = sender_name[i].charCodeAt();
                }
                dmsg[off] = 0;
                var infoMsg = new _InfoMessage(arrayInfoMsg, uint8View[SESSION_ID], dmsg[2]);
                if (dataChannel) dataChannel.send(arrayInfoMsg);
                queueInfoMsg(infoMsg);
                return;
            }
            else if (uint8View[MESSAGE_TYPE] == UPDATE_SESSION) {
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                        sessions[i].updateSession((uint8View[2] << 8 | uint8View[3]), (uint8View[4] << 8 | uint8View[5]));

                        var arrayMsgS = new ArrayBuffer(6);
                        var dmsg = new Uint8Array(arrayMsgS);
                        dmsg[0] = UPDATE_SESSION_ACK;
                        dmsg[1] = uint8View[SESSION_ID] + 128;
                        dmsg[2] = uint8View[2];
                        dmsg[3] = uint8View[3];
                        dmsg[4] = uint8View[4];
                        dmsg[5] = uint8View[5];
                        if (dataChannel) dataChannel.send(arrayMsgS);

                        return;
                    }
                }
                console.log('AppSharing: update session ' + uint8View[SESSION_ID] + ' not found!');
                return;
            }
            else if (uint8View[MESSAGE_TYPE] == DELETE_SESSION) {
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                        // Delete container!!
                        sessions.splice(i, 1);
                        onRemoveApp(uint8View[SESSION_ID]);

                        var arrayMsgS = new ArrayBuffer(2);
                        var dmsg = new Uint8Array(arrayMsgS);
                        dmsg[0] = DELETE_SESSION_ACK;
                        dmsg[1] = uint8View[SESSION_ID] + 128;
                        if (dataChannel) dataChannel.send(arrayMsgS);

                        console.log('AppSharing: send INFO_MESSAGE:RemParticipant sender_name=' + sender_name);

                        var arrayInfoMsg = new ArrayBuffer(5+sender_name.length+1);
                        var dmsg = new Uint8Array(arrayInfoMsg);

                        dmsg[0] = INFO_MESSAGE;
                        dmsg[1] = uint8View[SESSION_ID]+128;
                        dmsg[2] = infoMsgSeq++;
                        dmsg[3] = 1 + sender_name.length + 1;
                        dmsg[4] = 0x1; // Info(RemParticipant)
                        var off = 5;
                        for (var i = 0; i < sender_name.length; i++) {
                            dmsg[off++] = sender_name[i].charCodeAt();
                        }
                        dmsg[off] = 0;
                        var infoMsg = new _InfoMessage(arrayInfoMsg, uint8View[SESSION_ID], dmsg[2]);
                        if (dataChannel) dataChannel.send(arrayInfoMsg);
                        queueInfoMsg(infoMsg);
                    }
                }
                return;
            }

            var params = new Array(12);
            if (uint8View[MESSAGE_TYPE] == IMAGE_MESSAGE) {
                params[0] = uint8View[MESSAGE_TYPE];
                params[1] = uint8View[SESSION_ID];
                params[2] = uint8View[INDEX_X];
                params[3] = uint8View[INDEX_Y];
                params[4] = uint8View[BLOCK_VERSION];
                params[5] = uint8View[BLOCK_UPDATE];
                params[6] = uint8View[POS_X];
                params[7] = uint8View[POS_Y];
                params[8] = uint8View[DIM_X];
                params[9] = uint8View[DIM_Y];
                params[10] = uint8View[COMPRESSION_TYPE];

                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                        sessions[i].processImageMessage(uint8View, uint8View.length, params);
                        return;
                    }
                }
            }
            else if (uint8View[MESSAGE_TYPE] == MOUSE_CURSOR) {
                params[0] = uint8View[MESSAGE_TYPE];
                params[1] = uint8View[SESSION_ID];
                params[2] = (uint8View[2] << 8 | uint8View[3]);  // CoorX
                params[3] = (uint8View[4] << 8 | uint8View[5]);  // CoorY
                params[4] = uint8View[6];  // Mouse Type

                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                        sessions[i].processMouseMessage(params);
                        return;
                    }
                }
            }
            else if (uint8View[MESSAGE_TYPE] == INFO_MESSAGE) {
                if (uint8View[4] == 0 || uint8View[4] == 1) {  // AddParticipant || RemParticipant
                    if (uint8View[3] > 1) {
                        var tmpName = uint8View.slice(5, uint8View.length - 1);
                        var encodedString = String.fromCharCode.apply(null, tmpName);
                        var receiverName = decodeURIComponent(escape(encodedString));

                        var receiver = null;
                        for (var i = 0; i < receivers.length; i++) {
                            if (receivers[i].getRemoteName() == receiverName) {
                                receiver = receivers[i];
                                if ((uint8View[4] == 1) && (receivers[i].removeSessionId(uint8View[SESSION_ID] - 128) == 1) && (receivers[i].numSessions() == 0)) {
                                    console.log('AppSharing: remove receiver=' + i + ' sessionId=' + (uint8View[SESSION_ID] - 128));
                                    receiver.setDeleteParticipantFunction(onDeleteParticipant);
                                    receiver.deleteParticipant();
                                    receivers.splice(i, 1);
                                }
                                break;
                            }
                        }
                        // Create Receiver
                        if (uint8View[4] == 0) {
                            if(receiver == null) {
                                receiver = new _Receiver(receiverName);
                                console.log('AppSharing: Add new receiver=' + receiverName + ' sessionId=' + (uint8View[SESSION_ID] - 128) + ' receiverGuid=' + receiver.getReceiverGuid());
                                receivers.push(receiver);
                                receiver.setUpdateParticipantFunction(onUpdateParticipant);
                                receiver.updateParticipant();
                            }     
                            receiver.addSessionId(uint8View[SESSION_ID] - 128);
                        }
                    }
                }
                else if (uint8View[4] == 2 || uint8View[4] == 3 || uint8View[4] == 4) {   // GiveControl || TakeControl || RequestControl
                    if (uint8View[3] > 1) {
                        var tmpName = uint8View.slice(9, uint8View.length - 1);
                        var encodedString = String.fromCharCode.apply(null, tmpName);
                        var receiverName = decodeURIComponent(escape(encodedString));
                        var token = uint8View[5] << 24 | uint8View[6] << 16 | uint8View[7] << 8 | uint8View[8];

                        for (var i = 0; i < sessions.length; i++) {
                            if (sessions[i].getSessionId() == uint8View[SESSION_ID]) {
                                if (uint8View[4] == 2) sessions[i].setRemoteControl(token, true);
                                else if (uint8View[4] == 3) sessions[i].setRemoteControl(0, false);
                                break;
                            }
                        }
                        if (uint8View[4] == 4) {
                            // Remote Side sends this info message
                            for (var i = 0; i < receivers.length; i++) {
                                if (receivers[i].hasSessionId(uint8View[SESSION_ID] - 128) == 1) {
                                    onRequestRemoteControl(receivers[i].getReceiverGuid());
                                }
                            }
                        }
                    }
                }
                var arrayMsgS = new ArrayBuffer(3);
                var dmsg = new Uint8Array(arrayMsgS);
                dmsg[0] = INFO_MESSAGE_ACK;
                if(uint8View[SESSION_ID] >= 128) {
                    dmsg[1] = uint8View[SESSION_ID] - 128;
                }
                else {
                    dmsg[1] = uint8View[SESSION_ID] + 128;
                }
                dmsg[2] = uint8View[INFO_SEQUENCE];
                if (dataChannel) dataChannel.send(arrayMsgS);
            }
            else if (uint8View[MESSAGE_TYPE] == INFO_MESSAGE_ACK) {
                if(infoMessages.length) {
                    var tSessionId;
                    if(uint8View[SESSION_ID] >= 128) {
                        tSessionId = uint8View[SESSION_ID] - 128;
                    }
                    else {
                        tSessionId = uint8View[SESSION_ID];
                    }
                    for(var i = 0; i< infoMessages.length; i++) {
                        if (infoMessages[0].get_seq() == uint8View[INFO_SEQUENCE] && infoMessages[0].get_session_id() == tSessionId) {
                            console.log('AppSharing: Remove info message seq=' + uint8View[INFO_SEQUENCE] + ' session_id=' + tSessionId);
                            infoMessages.splice(i, 1);
                            break;
                        }
                    }
                }

                // Ignore this message here
            }
            else if (uint8View[MESSAGE_TYPE] == CREATE_SESSION_ACK) {
                // Ignore this message here
            }
            else if (uint8View[MESSAGE_TYPE] == UPDATE_SESSION_ACK) {
                // Ignore this message here
            }
            else if (uint8View[MESSAGE_TYPE] == DELETE_SESSION_ACK) {
                for (var i = 0; i < receivers.length; i++) {
                    if (receivers[i].removeSessionId(uint8View[SESSION_ID] - 128) == 1) {
                        if (receivers[i].numSessions() == 0) {
                            console.log('AppSharing: remove receiver=' + i + ' name=' + receivers[i].getRemoteName() + ' sessionId=' + (uint8View[SESSION_ID] - 128) + ' receiverGuid=' + receivers[i].getReceiverGuid());
                            receivers[i].setDeleteParticipantFunction(onDeleteParticipant);
                            receivers[i].deleteParticipant();
                            receivers.splice(i, 1);
                        }
                        break;
                    }
                }
            }
            else console.log('AppSharing: message not processed...');
        }

        this.close = function () {
            close();
        }

        this.init = function (dataChannel) {
            init(dataChannel);
        }

        this.sharing_event = function (type, data) {
            return sharingEvent(type, data);
        }

        this.recv = function (data) {
            recv(data);
        }
    }

    // public API
    return _AppSharing;
})();