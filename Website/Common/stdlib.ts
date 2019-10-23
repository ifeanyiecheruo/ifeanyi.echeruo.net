const STD = (function (setInterval) {
    return {
        animate: animate,
        callOnce: callOnce,
        callOnceT: callOnceT
    };

    function animate(durationMs: number, from: number, to: number, onStep: (value: number, cancel: ()=>void) => void, onCompleted): void {
        const startTime = Date.now();
        const delta = to - from;
        const fps = 24;

        const cancelImpl = () => {
            if (handle) {
                clearInterval(handle);
                handle = undefined;
                onCompleted(true);
            }
        };

        let handle = setInterval(() => {
            const t = (Date.now() - startTime) / durationMs;

            if (t < 0 || t > 1 && handle) {
                clearInterval(handle);
                handle = undefined;
            }

            if (!handle && onCompleted) {
                onCompleted(false);
                return;
            }

            onStep(from + (delta * t), cancelImpl);
        }, 1000/fps);
    }

    function callOnce(callback: () => void, ...args: any[]): () => void {
        return callOnceImpl(callback);
    }

    function callOnceT<T1>(callback: (t1: T1) => void, ...args: any[]): (t1: T1) => void {
        return callOnceImpl(callback);
    }

    function callOnceImpl(callback: (...args: any[]) => void, ...args: any[]): (...args: any[]) => void {
        var callCount = 0;

        return (args) => {
            callCount++;
            if (callCount > 1) {
                return;
            }
            try {
                callback(args);
            } finally {
                callCount--;
            }
        };
    }
})(window.setInterval);