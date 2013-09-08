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


    /**
     * Calls callback with all dependencies resolved,
     * and passed as arguments to the callback
     *
     * @param {Array} [dependences] Array of module names
     * @param {Function} callback
     */
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
    };
    /**
     * Defines a new module
     *
     * @param {Array} [dependences
     * @param {String} name Module name
     * @param {Function} factory Module factory,
     * will be called with all dependencies passed, as arguments
     */
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
})(window);
