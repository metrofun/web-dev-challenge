(function (global) {
    var modules = {},
        pendingRequires = [];

    function rerunPendingRequires() {
        var queueCopy = pendingRequires.slice(0);

        pendingRequires = [];
        queueCopy.forEach(function (pendingRequire) {
            global.require(pendingRequire.dependences, pendingRequire.callback);
        });
    }


    global.require = function (dependences, callback) {
        var resolvedDeps = [];

        dependences.forEach(function (moduleName) {
            if (modules.hasOwnProperty(moduleName)) {
                resolvedDeps.push(modules[moduleName]);
            }
        });
        if (resolvedDeps.length === dependences.length) {
            callback.apply(global, resolvedDeps);
        } else {
            pendingRequires.push({
                dependences: dependences,
                callback: callback
            });
        }
    }
    global.define = function () {
        var args = [].slice.apply(arguments),
            factory = args.pop(),
            name = args.pop(),
            dependences = args.pop() || [];

        global.require(dependences, function () {
            modules[name] = factory.apply(
                global,
                [].slice.call(arguments)
            );
            rerunPendingRequires();
        });
    };
})(window)
