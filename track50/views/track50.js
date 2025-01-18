"use strict";
function indexOf(haystack, needle) {
    var i = 0, length = haystack.length, idx = -1, found = false;
    while (i < length && !found) {
        if (haystack[i] === needle) {
            idx = i;
            found = true;
        }
        i++;
    }
    return idx;
};
/* Polyfill EventEmitter. */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    };
    removeListener(event, listener) {
        var idx;
        if (typeof this.events[event] === 'object') {
            idx = indexOf(this.events[event], listener);
            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    };
    emit(event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var i, listeners, length;
        if (typeof this.events[event] === 'object') {
            listeners = this.events[event].slice();
            length = listeners.length;
            for (i = 0; i < length; i++) {
                listeners[i].apply(this, args);
            }
        }
    };
    once(event, listener) {
        this.on(event, function g() {
            this.removeListener(event, g);
            listener.apply(this, arguments);
        });
    };
};
class SocketManager extends EventEmitter {
    /**
     * Socket manager
     */
    constructor(socket) {
        super()
        socket.onopen = function () {
            socket.send("ready");
        };
        socket.onerror = function (ev) {
            console.log("Error Socket: ".concat(JSON.stringify(ev)));
        };
        socket.onclose = function (ev) {
            console.log("Socket closed: ".concat(ev.reason, " | ").concat(ev.code, " | ").concat(ev.wasClean));
        };
        socket.onmessage = function (ev) {
            var dataIN = (ev.data);
            if (!dataIN.includes('(SocketSplit)')) {
                console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED");
                return socket.close(3000, "use protocol");
            }
            ;
            var _a = dataIN.split('(SocketSplit)'), method = _a[0], data = _a[1];
            if (!method || !data) {
                console.warn("CLOSED SOCKET METHOD || DATA IS FALSY");
                return socket.close(3000, 'use protocol');
            }
            try {
                self.emit(method, data);
            }
            catch (error) {
                console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED");
                socket.close(3000, 'use protocol ERROR: ' + error.message);
            }
        };
        self.once("name", function (name) {
            self.name = name;
            self.emit("ready", name);
        });
        return _this;
    }
    send(method, data) {
        this.socket.send("".concat(method, "(SocketSplit)").concat((data)));
    };
};

const data = {};
let username = `😯username😯`;
let serverlocation = `https://track50.vercel.app/track50`;
data.username = username;

const session = localStorage.getItem("smartconfig");
let id = '';

if (!session) {
    const newid = crypto.randomUUID();
    id = newid
    localStorage.setItem("smartconfig", newid);
    data.unique_session = true;
} else {
    id = session;
    data.unique_session = false;
}
data.id = JSON.stringify(id);

const isMobilePixel = () => window.innerWidth < 768 || screen.width < 768;
const hasTouchSupport = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (hasTouchSupport())
    data.browser_category = isMobilePixel() ? "mobile" : "tablet"
if (!isMobilePixel())
    data.browser_category = hasTouchSupport() ? "tablet" : "desktop"


data.browser_used = (function () {
    var N = navigator.appName, ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*([\d\.]+)/i);
    if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    return M.join(' ');
})();

fetch('http://ip-api.com/json/').then(res => res.json()).then(e => {
    data.loc = `${e.lat}_${e.lon}`;
    const handler = new SocketManager(new WebSocket(serverlocation));
    handler.on("READY", (code) => {
        if (code == 0) handler.send("PACKET", data);
    });
}).catch(console.error);