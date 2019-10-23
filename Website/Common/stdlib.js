var STD = (function (setInterval) {
    return {
        animate: animate,
        callOnce: callOnce,
        callOnceT: callOnceT
    };
    function animate(durationMs, from, to, onStep, onCompleted) {
        var startTime = Date.now();
        var delta = to - from;
        var fps = 24;
        var cancelImpl = function () {
            if (handle) {
                clearInterval(handle);
                handle = undefined;
                onCompleted(true);
            }
        };
        var handle = setInterval(function () {
            var t = (Date.now() - startTime) / durationMs;
            if (t < 0 || t > 1 && handle) {
                clearInterval(handle);
                handle = undefined;
            }
            if (!handle && onCompleted) {
                onCompleted(false);
                return;
            }
            onStep(from + (delta * t), cancelImpl);
        }, 1000 / fps);
    }
    function callOnce(callback) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return callOnceImpl(callback);
    }
    function callOnceT(callback) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return callOnceImpl(callback);
    }
    function callOnceImpl(callback) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var callCount = 0;
        return function (args) {
            callCount++;
            if (callCount > 1) {
                return;
            }
            try {
                callback(args);
            }
            finally {
                callCount--;
            }
        };
    }
})(window.setInterval);
