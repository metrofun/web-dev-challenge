define('utils', function () {
    function addWhiteSpace(string) {
        return ' ' + string + ' ';
    }
    return {
        /*
         * Creates document fragment from specified html
         *
         * @param {String} html
         *
         * @return {DocumentFragment)}
         */
        createHtmlElement: function (html) {
            var divNode = document.createElement('div'),
            documentFragment;

            divNode.insertAdjacentHTML('afterbegin', html);
            if (divNode.childElementCount > 1) {
                documentFragment = document.createDocumentFragment();
                while (divNode.firstChild) {
                    documentFragment.appendChild(divNode.firstChild);
                }
                return documentFragment;
            } else {
                return divNode.firstChild;
            }
        },
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
