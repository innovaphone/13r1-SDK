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

    var INNO_HDR_FLAGS = 0  // Offset 2
    var INNO_HDR_SEQ = 2  // Offset 2
    var INNO_HDR_MSG_TYPE = 4
    var INNO_HDR_APPL_ID = 5
    var INNO_HDR_SENDER_ID = 6
    var INNO_HDR_X_COOR = 8
    var INNO_HDR_Y_COOR = 10
    var INNO_HDR_X_DIM = 12
    var INNO_HDR_Y_DIM = 14
    var INNO_HDR_X_SIZE = 16
    var INNO_HDR_Y_SIZE = 18
    var INNO_HDR_RAW_COLOR = 20
    var INNO_HDR_NUM_EQUAL = 24
    var INNO_HDR_CRC_PNG256 = 28  // next three cannot appear in the same message
    var INNO_HDR_LENGTH = 32  // basic header length
    var INNO_HDR_RECEIVER_ID = INNO_HDR_LENGTH + 0;
    var INNO_HDR_SEQ_NUM = INNO_HDR_LENGTH + 2;
    var INNO_HDR_MSG_VK = INNO_HDR_LENGTH + 2;
    var INNO_HDR_NUM_LOST = INNO_HDR_LENGTH + 4;

    var BLOCK_MSG = 0;
    var BLOCK_MSG_256 = 1;
    var PLAIN_MSG = 2;
    var NONE_COMP = 0;
    var PNG_COMP = 1;
    var JPEG_COMP = 2;
    var END_BIT_SCTP = 0x80;
    var START_BIT_SCTP = 0x40;
    var END_BIT_IMG = 0x20;
    var START_BIT_IMG = 0x10;
    var INDEX_APP_ID = 10;

    var DUMMY_MSG = 8;
    var NEW_PICTURE = 9;
    var STOP_SHARING = 10;
    var SEND_NAME = 11;
    var SEND_MOUSE_TYPE = 12;
    var SEND_APP_NAME = 13;
    var SEQ_LOST = 128;
    var REQ_NEW_PIC = 130;
    var GIVE_CONTROL = 131;
    var TAKE_CONTROL = 132;
    var REQUEST_CONTROL = 133;
    var REQUEST_NAME = 135;
    var DUMMY_MSG_RX = 136;
    var LBUTTONDOWN = 192;
    var KEYPRESSED_UP = 203;
    var DISCARD_MSG = 254;

    // Constructor
    _Application = function (main, senderId, appId, appName, onUpdateParticipant, onUpdateApp, onResizeApp, onRemoveApp, onRemoteControl, onRequestRemoteControl, dataChannel) {
        var image_data = null;
        var img_h = 0;
        var img_w = 0;
        var have_control = false;
        var scale_image = true;
        var m_offset_x = 0;
        var m_offset_y = 0;
        var last_mouse_x = 0;
        var last_mouse_y = 0;
        var sender_id = senderId;
        var app_id = appId;
        var app_name = appName;
        var sender_name = "";
        var container_id = null;
        var onUpdateApp = onUpdateApp;
        var onUpdateParticipant = onUpdateParticipant;
        var onResizeApp = onResizeApp;
        var onRemoveApp = onRemoveApp;
        var onRemoteControl = onRemoteControl;
        var onRequestRemoteControl = onRequestRemoteControl;
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
            canvas_id[k].setAttribute("id", "webrtc.sharing." + senderId + "." + appId);
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
                var arrayMsg = new ArrayBuffer(36);
                var dmsg = new Uint8Array(arrayMsg);
                var t_seq = main.getInnoSeq();
                dmsg[INNO_HDR_FLAGS] = 0xf0;
                dmsg[INNO_HDR_MSG_TYPE] = 198;
                dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
                dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
                dmsg[INNO_HDR_APPL_ID] = app_id;
                dmsg[INNO_HDR_X_COOR] = (coord[0] >> 8) & 0xff;
                dmsg[INNO_HDR_X_COOR + 1] = coord[0] & 0xff;
                dmsg[INNO_HDR_Y_COOR] = (coord[1] >> 8) & 0xff;
                dmsg[INNO_HDR_Y_COOR + 1] = coord[1] & 0xff;
                dmsg[INNO_HDR_SENDER_ID + 0] = 0;
                dmsg[INNO_HDR_SENDER_ID + 1] = 0;
                dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
                dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
                if (data_channel) data_channel.send(arrayMsg);
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
                var arrayMsg = new ArrayBuffer(36);
                var dmsg = new Uint8Array(arrayMsg);
                var t_seq = main.getInnoSeq();
                dmsg[INNO_HDR_FLAGS] = 0xf0;
                dmsg[INNO_HDR_MSG_TYPE] = coord[2];   // mouse_click
                dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
                dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
                dmsg[INNO_HDR_APPL_ID] = app_id;
                dmsg[INNO_HDR_X_COOR] = (coord[0] >> 8) & 0xff;
                dmsg[INNO_HDR_X_COOR + 1] = coord[0] & 0xff;
                dmsg[INNO_HDR_Y_COOR] = (coord[1] >> 8) & 0xff;
                dmsg[INNO_HDR_Y_COOR + 1] = coord[1] & 0xff;
                dmsg[INNO_HDR_SENDER_ID + 0] = 0;
                dmsg[INNO_HDR_SENDER_ID + 1] = 0;
                dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
                dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
                if (data_channel) data_channel.send(arrayMsg);
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
                var arrayMsg = new ArrayBuffer(36);
                var dmsg = new Uint8Array(arrayMsg);
                var t_seq = main.getInnoSeq();
                dmsg[INNO_HDR_FLAGS] = 0xf0;
                dmsg[INNO_HDR_MSG_TYPE] = coord[2];   // mouse_click
                dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
                dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
                dmsg[INNO_HDR_APPL_ID] = app_id;
                dmsg[INNO_HDR_X_COOR] = (coord[0] >> 8) & 0xff;
                dmsg[INNO_HDR_X_COOR + 1] = coord[0] & 0xff;
                dmsg[INNO_HDR_Y_COOR] = (coord[1] >> 8) & 0xff;
                dmsg[INNO_HDR_Y_COOR + 1] = coord[1] & 0xff;
                dmsg[INNO_HDR_SENDER_ID + 0] = 0;
                dmsg[INNO_HDR_SENDER_ID + 1] = 0;
                dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
                dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
                if (data_channel) data_channel.send(arrayMsg);
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

            var arrayMsg = new ArrayBuffer(36);
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = main.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = 199;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = app_id;
            dmsg[INNO_HDR_X_COOR] = 0;
            dmsg[INNO_HDR_X_COOR + 1] = (e.wheelDelta < 0 ? 1 : 0);
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
            if (data_channel) data_channel.send(arrayMsg);

            e.stopPropagation();
            e.preventDefault();
            e.cancelBubble = false;
        }

        function mouseWheel(e) {
            // build msg!!!!
            var arrayMsg = new ArrayBuffer(36);
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = main.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = 199;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = app_id;
            dmsg[INNO_HDR_X_COOR] = 0;
            dmsg[INNO_HDR_X_COOR + 1] = (e.wheelDelta < 0 ? 1 : 0);
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
            if (data_channel) data_channel.send(arrayMsg);
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
            // build msg!!!!
            var arrayMsg = new ArrayBuffer(36);
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = main.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = ret[1];
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = app_id;
            dmsg[INNO_HDR_X_COOR + 0] = (ret[2] >> 8) & 0xff;
            dmsg[INNO_HDR_X_COOR + 1] = ret[2] & 0xff;
            dmsg[INNO_HDR_Y_COOR + 0] = 0;
            dmsg[INNO_HDR_Y_COOR + 1] = 1;
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
            dmsg[INNO_HDR_MSG_VK + 0] = (ret[2] >> 8) & 0xff;
            dmsg[INNO_HDR_MSG_VK + 1] = ret[2] & 0xff;
            if (data_channel) data_channel.send(arrayMsg);
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
                    var arrayMsg = new ArrayBuffer(36);
                    var dmsg = new Uint8Array(arrayMsg);
                    var t_seq = main.getInnoSeq();
                    dmsg[INNO_HDR_FLAGS] = 0xf0;
                    dmsg[INNO_HDR_MSG_TYPE] = ret[1];
                    dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
                    dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
                    dmsg[INNO_HDR_APPL_ID] = app_id;
                    dmsg[INNO_HDR_X_COOR + 0] = (ret[2] >> 8) & 0xff;
                    dmsg[INNO_HDR_X_COOR + 1] = ret[2] & 0xff;
                    dmsg[INNO_HDR_Y_COOR + 0] = 0;
                    dmsg[INNO_HDR_Y_COOR + 1] = 1;
                    dmsg[INNO_HDR_SENDER_ID + 0] = 0;
                    dmsg[INNO_HDR_SENDER_ID + 1] = 0;
                    dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
                    dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
                    dmsg[INNO_HDR_MSG_VK + 0] = (ret[2] >> 8) & 0xff;
                    dmsg[INNO_HDR_MSG_VK + 1] = ret[2] & 0xff;
                    if (data_channel) data_channel.send(arrayMsg);
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
                    var arrayMsg = new ArrayBuffer(36);
                    var dmsg = new Uint8Array(arrayMsg);
                    var t_seq = main.getInnoSeq();
                    dmsg[INNO_HDR_FLAGS] = 0xf0;
                    dmsg[INNO_HDR_MSG_TYPE] = ret[1];
                    dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
                    dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
                    dmsg[INNO_HDR_APPL_ID] = app_id;
                    dmsg[INNO_HDR_X_COOR + 0] = (ch >> 8) & 0xff;
                    dmsg[INNO_HDR_X_COOR + 1] = ch & 0xff;
                    dmsg[INNO_HDR_Y_COOR + 0] = 0;
                    dmsg[INNO_HDR_Y_COOR + 1] = 1;
                    dmsg[INNO_HDR_SENDER_ID + 0] = 0;
                    dmsg[INNO_HDR_SENDER_ID + 1] = 0;
                    dmsg[INNO_HDR_RECEIVER_ID + 0] = (sender_id >> 8) & 0xff;
                    dmsg[INNO_HDR_RECEIVER_ID + 1] = sender_id & 0xff;
                    dmsg[INNO_HDR_MSG_VK + 0] = (ret[2] >> 8) & 0xff;
                    dmsg[INNO_HDR_MSG_VK + 1] = ret[2] & 0xff;
                    if (data_channel) data_channel.send(arrayMsg);
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

        this.processMessage = function (blob, length, params) {
            var msg = params[0];
            var imageRes = blob;
            var rx_sender = params[13];
            var rx_app = params[INDEX_APP_ID];
            var index = INNO_HDR_SEQ_NUM + 2;  // INNO_HDR_SEQ_NUM+2;

            if (msg == BLOCK_MSG || msg == BLOCK_MSG_256 || msg == PLAIN_MSG) {
                //log('Image ' + params[1] + 'x' + params[2] + ' ' + params[3] + 'x' + params[4] + ' ' + params[5] + 'x' + params[6]);
                //log('Image ' + uint8View[INNO_HDR_X_DIM] + ' ' + uint8View[INNO_HDR_X_DIM + 1] + ' ' + uint8View[INNO_HDR_Y_DIM] + ' ' + uint8View[INNO_HDR_Y_DIM + 1]);
                if ((params[5] != img_w) || (params[6] != img_h)) {
                    console.log('AppSharing: dimensions changed(' + rx_sender + ', ' + rx_app + ') ' + params[5] + 'x' + params[6] + ' old ' + img_w + 'x' + img_h);
                    if (image_data) image_data = null;
                    image_data = ctx_id[0].createImageData(params[5], params[6]);
                    img_w = params[5];
                    img_h = params[6];

                    canvas_id[0].width = params[5];
                    canvas_id[0].height = params[6];
                    canvas_id[0].style.width = params[5] + "px";
                    canvas_id[0].style.height = params[6] + "px";

                    canvas_id[1].width = params[5];
                    canvas_id[1].height = params[6];
                    canvas_id[1].style.width = params[5] + "px";
                    canvas_id[1].style.height = params[6] + "px";

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
                //log('Coordinates (' + params[1] + ',' + params[2] + '),(' + params[3] + ',' + params[4] + '),(' + params[5] + ',' + params[6] + ') ' + params[7]);
                if (params[0] == PLAIN_MSG) {
                    //log('PLAIN Message ' + params[1] + 'x' + params[2] + ' ' + params[3] + 'x' + params[4]);
                    var raw_value = params[12];
                    var offset = (params[2] * params[5] + params[1]) * 4;
                    var img_data = image_data.data;
                    for (var i = 0; i < params[4]; i++) {
                        var n_offset = offset + (i * params[5] * 4);
                        for (var j = 0; j < (params[3] * 4) ; j += 4) {
                            // i+3 is alpha (the fourth element)
                            img_data[n_offset + j + 0] = (raw_value >> 16) & 0xff;
                            img_data[n_offset + j + 1] = (raw_value >> 8) & 0xff;
                            img_data[n_offset + j + 2] = (raw_value >> 0) & 0xff;
                            img_data[n_offset + j + 3] = 0xff;        // alpha
                        }
                    }
                    if (params[8] & END_BIT_IMG) redrawCanvas(params[5], params[6]);
                    return;
                }
                readPngCb(blob, params);
            }
            else if (params[0] == REQUEST_CONTROL) {
                onRequestRemoteControl(sender_id, app_id);
            }
            else if (params[0] == GIVE_CONTROL) { 
                console.log('AppSharing: got control from ' + rx_sender + ' control ' + have_control);

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
                have_control = true;
                onRemoteControl(sender_id, app_id, true);
            }
            else if (params[0] == TAKE_CONTROL) {
                console.log('AppSharing: control removed from ' + rx_sender + ' control ' + have_control);

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
                have_control = false;
                onRemoteControl(sender_id, app_id, false);
                mouse_type = -1;
                if (container_id && mouse_element) container_id.appendChild(mouse_element);
            }
            else {   // MSG
                //log('readMsgCb');
                readMsgCb(blob, length, params);
            }
        }

        function readMsgCb(blob, length, params) {
            var msg = params[0];
            var imageRes = blob;
            var rx_sender = params[13];
            var rx_app = params[INDEX_APP_ID];
            var index = INNO_HDR_SEQ_NUM + 2;  // INNO_HDR_SEQ_NUM+2;
            //log("message " + msg + " sender " + rx_sender);
            if (msg == DUMMY_MSG) {
                if (app_name == null) main.requestAppName(rx_sender, rx_app);
            }
            else if (msg == DUMMY_MSG_RX) {
                if (sender_name == null) main.requestAppName(rx_sender, 0xff);
            }
            else if (msg == SEND_NAME) {
                console.log('AppSharing: NAME from ' + rx_sender + ' for app=' + rx_app + ' l=' + imageRes[index]);
                var result = "";
                for (var i = index + 1; i < (imageRes[index] + (index + 1)) ; i++) {
                    if (imageRes[i]) result += String.fromCharCode(imageRes[i]);
                }
                if (result !== "") {
                    sender_name = result;
                    if (onUpdateParticipant) onUpdateParticipant(sender_id, sender_name);
                }
                console.log('AppSharing: NAME(' + rx_sender + ', ' + sender_name + ')');
            }
            else if (msg == NEW_PICTURE || msg == SEND_APP_NAME) {
                console.log('AppSharing: NEW_PICTURE||SEND_APP_NAME from ' + rx_sender + ' for app=' + rx_app);
                if (imageRes[index] == 0) {
                    var result = "";
                    for (var i = index + 2; i < (imageRes[index + 1] + (index + 2)) ; i++) {
                        if (imageRes[i]) result += String.fromCharCode(imageRes[i]);
                    }
                    sender_name = result;
                    index += (2 + imageRes[index + 1]);
                    if (sender_name !== "") {
                        if (onUpdateParticipant) onUpdateParticipant(sender_id, sender_name);
                    }
                }
                if (index < length) {
                    if (imageRes[index] == 1) {
                        app_name = "";
                        for (var i = index + 2; i < (imageRes[index + 1] + (index + 2)) ; i++) {
                            if (imageRes[i]) app_name += String.fromCharCode(imageRes[i]);
                        }
                        if (onUpdateApp) onUpdateApp(rx_sender, rx_app, app_name);
                        if (app_name.indexOf("Desktop") == 0) cursor_offset = true;
                    }
                }
                console.log('AppSharing: Sender-App Info(' + rx_sender + ', ' + app_name + ')');
            }
            else if (msg == STOP_SHARING) {
                console.log('AppSharing: STOP_SHARING app=' + rx_app + ' sender=' + params[13] + ' target=' + params[15]);
                if (onRemoveApp) onRemoveApp(rx_sender, app_id);
                if (image_data) image_data = null;
                img_w = 0;
                img_h = 0;
                app_name = "app_" + rx_sender + "_" + rx_app;
                have_control = false;

                ctx_id[2].clearRect(0, 0, canvas_id[2].width, canvas_id[2].height);
            }
            else if (msg == SEND_MOUSE_TYPE) {
                //log("message " + msg + " pos " + params[1] + "x" + params[2] + " mouse:" + mouse_type + " x:" + m_offset_x + " y:" + m_offset_y);
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
                        if (mouse_type != params[14]) {
                            switch (params[14]) {
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
                            mouse_type = params[14];
                        }
                    }
                }
                else if (mouse_element != null) {
                    if (mouse_type != params[14]) {
                        switch (params[14]) {
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
                        mouse_type = params[14];
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
                    mouse_element.style.left = (((params[1] + m_offset_x) * scale_x) + offX) + "px";
                    mouse_element.style.top = (((params[2] + m_offset_y) * scale_y) + 32) + "px";  // 32 is the header size for the appName
                }
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
            var rx_sender = params[13];
            var rx_app = params[INDEX_APP_ID];
            var img_data = image_data.data;
            var imageRes = blob;
            var index = INNO_HDR_LENGTH + 4;  // + INNO_HDR_PKT_LEN
            if (params[9] == PNG_COMP) { // PNG
                if (imageRes[index + 1] != 80 || imageRes[index + 2] != 78 || imageRes[index + 3] != 71) {   // PNG
                    console.log('AppSharing: Unknown PNG format...' + imageRes[index + 1] + imageRes[index + 2] + imageRes[index + 3]);
                }
                else {
                    var png = new innovaphone.applicationSharing.PNG(imageRes, index);
                    var pixels = png.decode();
                    for (var l = 0; l < (params[11] + 1) ; l++) {
                        var k = 0;
                        var offset = (params[2] * params[5] + (l * params[3] + params[1])) * 4;
                        for (var i = 0; i < params[4]; i++) {
                            var n_offset = offset + (i * params[5] * 4);
                            for (var j = 0; j < (params[3] * 4) ; j += 4) {
                                // i+3 is alpha (the fourth element)
                                img_data[n_offset + j + 0] = pixels[k++];
                                img_data[n_offset + j + 1] = pixels[k++];
                                img_data[n_offset + j + 2] = pixels[k++];
                                img_data[n_offset + j + 3] = pixels[k++];        // alpha
                            }
                        }
                    }
                }
            }
            else {
                var j = new innovaphone.applicationSharing.JpegImage();
                j.parse(imageRes, index);
                for (var l = 0; l < (params[11] + 1) ; l++) {
                    var offset = (params[2] * params[5] + (l * params[3] + params[1])) * 4;
                    j.copyToImageDataOffset(image_data, offset, params[3], params[4]);
                }
            }

            //console.log("AppSharing: END_BIT_IMG rx " + rx_sender + " params[8] " + params[8] + " rx_app=" + rx_app);

            if (params[8] & END_BIT_IMG) redrawCanvas(params[5], params[6]);
        }

        this.getContainerWidth = function () {
            if (container_id) parseInt(container_id.style.width || container_id.offsetWidth, 10);
            else return getWidth();
        }

        this.getContainerHeight = function () {
            if (container_id) parseInt(container_id.style.height || container_id.offsetHeight, 10);
            else return getHeight();
        }

        this.getAppId = function () {
            return app_id;
        }

        this.getAppName = function () {
            return app_name;
        }

        this.getSenderId = function () {
            return sender_id;
        }

        this.getSenderName = function () {
            return sender_name;
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
            console.log('AppSharing: [' + sender_id + ',' + app_id + '] new=' + container + ' old=' + container_id);
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

        this.setRequestRemoteControlFunction = function (requestRemoteControlFunc) {
            onRequestRemoteControl = requestRemoteControlFunc;
        }

        this.setUpdateFunction = function (updateFunc) {
            onUpdateApp = updateFunc;
            if (app_name != null) onUpdateApp(sender_id, app_id, app_name);
        }

        this.setUpdateParticipantFunction = function (updateFunc) {
            onUpdateParticipant = updateFunc;
            if (sender_name != null) onUpdateParticipant(sender_id, sender_name);
        }

        this.setResizeFunction = function (resizeFunc) {
            onResizeApp = resizeFunc;
        }

    }

    // Constructor
    function _AppSharing(displayname) {
        var inno_seq = 0;
        var sender_changed = false;

        var appContainers = []; // list of _Application 

        var sender_name = displayname;
        var sender_name_len = sender_name.length;
        var dataChannel = null;
        var onCreateApp = null;
        var onUpdateApp = null;
        var onRemoveApp = null;
        var onResizeApp = null;  
        var onRemoteControl = null;
        var onUpdateParticipant = null;
        var onRequestRemoteControl = null;
        var num_packets_rx = 0;
        var num_packets_proc = 0;

        self.getInnoSeq = function () {
            return ++inno_seq;
        }

        function sendOwnName(dest_id) {
            if (sender_name_len == 0) {
                console.log('AppSharing: sender name is empty');
                return;
            }
            console.log('AppSharing: Send display name (' + sender_name + ')');
            var arrayMsgS = new ArrayBuffer(36 + 1 + (sender_name_len << 1));
            var dmsg = new Uint8Array(arrayMsgS);
            var t_seq = this.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = SEND_NAME;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = 0xff;
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (dest_id >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = dest_id & 0xff;
            dmsg[INNO_HDR_LENGTH + 4] = (sender_name_len << 1);
            var nstr = sender_name;
            var ind_a = INNO_HDR_LENGTH + 5;
            for (var i = 0; i < sender_name_len; i++) {
                var c = nstr.charCodeAt(i);
                //log('name = ' + c);
                dmsg[ind_a + 0] = c & 0xff;
                dmsg[ind_a + 1] = (c >> 8) & 0xff;
                ind_a = ind_a + 2;
            }
            if (dataChannel) dataChannel.send(arrayMsgS);
            else console.log('AppSharing: sendOwnName failed, no dataChannel available');
        }

        self.requestAppName = function (dest, app) {
            var arrayMsg = new ArrayBuffer(36);
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = this.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = REQUEST_NAME;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = app;
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (dest >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = dest & 0xff;
            if (dataChannel) dataChannel.send(arrayMsg);
            else console.log('AppSharing: requestAppName failed, no dataChannel available');
        }

        self.requestNewPicture = function(dest, app) {
            var arrayMsg = new ArrayBuffer(36);
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = this.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = REQ_NEW_PIC;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = app;
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (dest >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = dest & 0xff;
            if (dataChannel) dataChannel.send(arrayMsg);
            else console.log('AppSharing: requestNewPicture failed, no dataChannel available');
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
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setUpdateParticipantFunction(onUpdateParticipant);
                        }
                    }
                    break;
                case 'updateAppCallback':
                    onUpdateApp = data;
                    if (onUpdateApp) {
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setUpdateFunction(onUpdateApp);
                        }
                    }
                    break;
                case 'createAppCallback':
                    onCreateApp = data;
                    if (onCreateApp) {
                        for (var i = 0; i < appContainers.length; i++) {
                            if(appContainers[i].getAppId() != 0xff) onCreateApp(appContainers[i].getSenderId(), appContainers[i].getAppId(), appContainers[i].getAppName());
                        }
                    }
                    break;
                case 'remoteControlCallback':
                    onRemoteControl = data;
                    if (onRemoteControl) {
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setRemoteControlFunction(onRemoteControl);
                        }
                    }
                    break;
                case 'onRequestRemoteControl':
                    onRequestRemoteControl = data;
                    if (onRequestRemoteControl) {
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setRequestRemoteControlFunction(onRequestRemoteControl);
                        }
                    }
                    break;
                case 'removeAppCallback':
                    onRemoveApp = data;
                    if (onRemoveApp) {
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setRemoveFunction(onRemoveApp);
                        }
                    }
                    break;
                case 'resizeAppCallback':
                    onResizeApp = data;
                    if (onResizeApp) {
                        for (var i = 0; i < appContainers.length; i++) {
                            appContainers[i].setResizeFunction(onResizeApp);
                        }
                    }
                    break;
                case 'setname':
                    setOwnName(data);
                    break;
                case 'fitToElement':
                    fitToElement(data);
                    break;
                case 'adjustImageToCanvas':
                    adjustImageToCanvas(data);
                    break;
                case 'requestControl':
                    requestControl(data);
                    break;
                default:
                    console.log('AppSharing: unknown event received: ' + type);
            }
            //log('sharingEvent -> ' + type);
        }

        function setOwnName(data) {
            sender_name = data;
            if (sender_name) sender_name_len = sender_name.length;
            else sender_name_len = 0;
            if (sender_name_len > 0) {
                for (var i = 0; i < appContainers.length; i++) {
                    sendOwnName(appContainers[i].getSenderId());
                }
            }
        }

        function fitToElement(data) {
            console.log('AppSharing: fitToElement app=' + data.app + ' sender=' + data.sender + ' cont=' + data.container);
            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == data.sender && appContainers[i].getAppId() == data.app) {
                    appContainers[i].fitToElement();
                    break;
                }
            }
        }

        function adjustImageToCanvas(data) {
            console.log('AppSharing: adjustImageToCanvas sender = ' + data.sender + ' app = ' + data.id);
            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == data.sender && appContainers[i].getAppId() == data.id) {
                    appContainers[i].adjustImageToCanvas(data.width, data.height);
                    break;
                }
            }
        }

        function requestControl(data) {
            var foundSender = 0;
            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == data.sender && appContainers[i].getAppId() == data.id) {
                    if (appContainers[i].haveControl()) return;
                    foundSender = 1;
                    break;
                }
            }
            if (!foundSender) return;

            console.log('AppSharing: request control l=' + sender_name_len + ' sender=' + data.sender);

            // Disable Request Control button and different style?
            var arrayMsg = new ArrayBuffer(36 + 1 + (sender_name_len << 1));
            var dmsg = new Uint8Array(arrayMsg);
            var t_seq = this.getInnoSeq();
            dmsg[INNO_HDR_FLAGS] = 0xf0;
            dmsg[INNO_HDR_MSG_TYPE] = REQUEST_CONTROL;
            dmsg[INNO_HDR_SEQ + 0] = (t_seq >> 8) & 0xff;
            dmsg[INNO_HDR_SEQ + 1] = t_seq & 0xff;
            dmsg[INNO_HDR_APPL_ID] = 0xff;
            dmsg[INNO_HDR_SENDER_ID + 0] = 0;
            dmsg[INNO_HDR_SENDER_ID + 1] = 0;
            dmsg[INNO_HDR_RECEIVER_ID + 0] = (data.sender >> 8) & 0xff;
            dmsg[INNO_HDR_RECEIVER_ID + 1] = data.sender & 0xff;
            dmsg[INNO_HDR_LENGTH + 4] = (sender_name_len << 1);
            var nstr = sender_name;
            var ind_a = INNO_HDR_LENGTH + 5;
            for (var i = 0; i < sender_name_len; i++) {
                var c = nstr.charCodeAt(i);
                //log('name = ' + c);
                dmsg[ind_a + 0] = c & 0xff;
                dmsg[ind_a + 1] = (c >> 8) & 0xff;
                ind_a = ind_a + 2;
            }
            if (dataChannel) dataChannel.send(arrayMsg);
        }

        // public
        var close = function () {
            console.log('AppSharing: Close app sharing containers=' + appContainers.length);
            dataChannel = null;
            appContainers = [];
        }

        var init = function (data_channel) {
            dataChannel = data_channel;
            for (var i = 0; i < appContainers.length; i++) {
                appContainers[i].setDataChannel(dataChannel);
            }
            if (dataChannel) console.log('AppSharing: Application Sharing initialised!');
            else console.log('AppSharing: Application Sharing initialised without dataChanel!');
        }

        var setFullScreenMode = function (data) {
            console.log('AppSharing: setFullScreenMode for sender ' + data.sender + " with id " + data.id + " and container " + data.container + " mode " + data.mode);
            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == data.sender && appContainers[i].getAppId() == data.id) {
                    appContainers[i].setFullScreenMode(data.container, data.width, data.height, data.mode);
                }
            }
        }

        var setAppContainer = function (data) {
            console.log('AppSharing: setAppContainer for sender ' + data.sender + " with id " + data.id + " and container " + data.container);
            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == data.sender && appContainers[i].getAppId() == data.id) {
                    if (data.container != null) appContainers[i].setContainer(data.container);
                    else {
                        appContainers.splice(i, 1);
                        console.log('AppSharing: application for sender ' + data.sender + " and id " + data.id + " removed!" + " apps=" + appContainers.length);
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
                var uint8View = new Uint8Array(appData);
                var rx_sender = (uint8View[INNO_HDR_SENDER_ID] << 8 | uint8View[INNO_HDR_SENDER_ID + 1]);
                if (rx_sender == 0xffff) {
                    var rx_target = (uint8View[INNO_HDR_RECEIVER_ID] << 8 | uint8View[INNO_HDR_RECEIVER_ID + 1]);
                    console.log('AppSharing: message from conference interface! t=' + rx_target);
                    for (var i = appContainers.length - 1; i >= 0; i--) {
                        if (appContainers[i].getSenderId() == rx_target) {
                            if (onRemoveApp) onRemoveApp(appContainers[i].getSenderId(), appContainers[i].getAppId());
                            appContainers.splice(i, 1);
                        }
                    }
                    return;
                }
                processingNode(uint8View);
            }
        }

        var processingNode = function (uint8View) {
            var params = new Array(32);

            params[0] = uint8View[INNO_HDR_MSG_TYPE];
            params[1] = uint8View[INNO_HDR_X_COOR] << 8 | uint8View[INNO_HDR_X_COOR + 1];
            params[2] = uint8View[INNO_HDR_Y_COOR] << 8 | uint8View[INNO_HDR_Y_COOR + 1];
            params[3] = ((uint8View[INNO_HDR_X_DIM] << 8) & 0xff00) | (uint8View[INNO_HDR_X_DIM + 1] & 0xff);
            params[4] = uint8View[INNO_HDR_Y_DIM] << 8 | uint8View[INNO_HDR_Y_DIM + 1];
            params[5] = uint8View[INNO_HDR_X_SIZE] << 8 | uint8View[INNO_HDR_X_SIZE + 1];
            params[6] = uint8View[INNO_HDR_Y_SIZE] << 8 | uint8View[INNO_HDR_Y_SIZE + 1];
            params[7] = uint8View[INNO_HDR_CRC_PNG256] << 24 | uint8View[INNO_HDR_CRC_PNG256 + 1] << 16 | uint8View[INNO_HDR_CRC_PNG256 + 2] << 8 | uint8View[INNO_HDR_CRC_PNG256 + 3];
            params[8] = uint8View[INNO_HDR_FLAGS] & (END_BIT_IMG | START_BIT_IMG);
            params[9] = uint8View[INNO_HDR_FLAGS] & 0xf;
            params[INDEX_APP_ID] = uint8View[INNO_HDR_APPL_ID];
            params[11] = uint8View[INNO_HDR_NUM_EQUAL] << 24 | uint8View[INNO_HDR_NUM_EQUAL + 1] << 16 | uint8View[INNO_HDR_NUM_EQUAL + 2] << 8 | uint8View[INNO_HDR_NUM_EQUAL + 3];
            params[12] = uint8View[INNO_HDR_RAW_COLOR] << 24 | uint8View[INNO_HDR_RAW_COLOR + 1] << 16 | uint8View[INNO_HDR_RAW_COLOR + 2] << 8 | uint8View[INNO_HDR_RAW_COLOR + 3];
            params[13] = uint8View[INNO_HDR_SENDER_ID] << 8 | uint8View[INNO_HDR_SENDER_ID + 1];
            params[14] = uint8View[INNO_HDR_SEQ_NUM] << 8 | uint8View[INNO_HDR_SEQ_NUM + 1];
            params[15] = uint8View[INNO_HDR_RECEIVER_ID] << 8 | uint8View[INNO_HDR_RECEIVER_ID + 1];

            var rx_sender = params[13];
            var rx_app = params[INDEX_APP_ID];

            if(params[0] != DUMMY_MSG) console.log('AppSharing: received from ' + rx_sender + ' app=' + rx_app + ' and msg=' + params[0] + ' seq=' + (uint8View[INNO_HDR_SEQ] << 8 | uint8View[INNO_HDR_SEQ + 1]) + ' for=' + params[15]);

            if (params[0] == DISCARD_MSG || params[0] == REQ_NEW_PIC || params[0] == SEQ_LOST || (params[0] >= LBUTTONDOWN && params[0] <= KEYPRESSED_UP)) {
                return;
            }
            if (params[0] == REQUEST_NAME) {
                sendOwnName(rx_sender);
                return;
            } 

            for (var i = 0; i < appContainers.length; i++) {
                if (appContainers[i].getSenderId() == rx_sender && appContainers[i].getAppId() == rx_app) {
                    appContainers[i].processMessage(uint8View, uint8View.length, params);
                    return;
                }
            }
            if (params[0] == TAKE_CONTROL || params[0] == GIVE_CONTROL) {
                for (var i = 0; i < appContainers.length; i++) {
                    if (appContainers[i].getSenderId() == rx_sender) {
                        appContainers[i].processMessage(uint8View, uint8View.length, params);
                    }
                }
                return;
            }
            if (rx_app == 0xff) {
                if (params[0] == SEND_NAME || params[0] == DUMMY_MSG_RX) {
                    for (var i = 0; i < appContainers.length; i++) {
                        if (appContainers[i].getSenderId() == rx_sender) {
                            appContainers[i].processMessage(uint8View, uint8View.length, params);
                            return;
                        }
                    }
                    var app = new _Application(this, rx_sender, rx_app, null, onUpdateParticipant, onUpdateApp, onResizeApp, onRemoveApp, onRemoteControl, onRequestRemoteControl, dataChannel);
                    appContainers.push(app);
                    app.processMessage(uint8View, uint8View.length, params);
                }
                return;
            }
            self.requestNewPicture(rx_sender, rx_app);
            self.requestAppName(rx_sender, rx_app);
            sendOwnName(rx_sender);

            // Dummy Message does not add an application, has to be another message, like data or sender/app name
            if (params[0] != 8) {
                var app = new _Application(this, rx_sender, rx_app, null, onUpdateParticipant, onUpdateApp, onResizeApp, onRemoveApp, onRemoteControl, onRequestRemoteControl, dataChannel);
                appContainers.push(app);

                console.log('AppSharing: onCreateApp for ' + rx_sender + ' app=' + rx_app + ' and msg=' + params[0]);

                // onCreateApp must be called first to avoid processMessage calling onUpdate if the first message is the application name
                // and the app must be added before to the list because onCreateApp calls setAppContainer directly
                onCreateApp(rx_sender, rx_app, null);
                app.processMessage(uint8View, uint8View.length, params);
            }
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