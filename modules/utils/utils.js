define('utils', function () {
    function addWhiteSpace(string) {
        return ' ' + string + ' ';
    }
    return {
        delegate: function (selector, eventType, handler) {
            var classTokens = selector.split(/^\.|\s+\./).filter(Boolean).reverse();

            document.addEventListener(eventType, function (e) {
                var element = e.target,
                    result,
                    unmatchedTokens = classTokens.slice();

                while (unmatchedTokens.length && element !== document) {
                    if (element.classList.contains(unmatchedTokens[0])) {
                        result = result || element;
                        unmatchedTokens.shift();
                    }
                    element = element.parentNode;
                }
                if (!unmatchedTokens.length) {
                    handler.call(result, e);
                }
            });
        },
        getParentByClassName: function (element, parentClass) {
            var parentNode = element.parentNode;

            while (parentNode !== null) {
                if (parentNode.classList.contains(parentClass)) {
                    return parentNode;
                }
                parentNode = parentNode.parentNode;
            }
            return null;
        }
    };
});
