define('utils', function () {
    return {
        /**
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
        /*
         * Attach a handler to one or more events
         * for all elements that match the selector,
         * now or in the future.
         *
         * Accepts only non-adjoining class selectors.
         *
         * @param {String} selector
         * @param {String} eventType
         * @param {Function} handler
         */
        delegate: function (selector, eventType, handler) {
            var classTokens = selector.split(/^\.|\s+\./).filter(Boolean).reverse();

            document.addEventListener(eventType, function (e) {
                var element = e.target,
                    result,
                    unmatchedTokens = classTokens.slice();

                while (unmatchedTokens.length && element && element !== document) {
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
        /**
         * Returns parent by className
         *
         * @param {Object} element Subject node, for searching parents
         * @param {String} parentClass
         *
         * @returns {Object|null} Returns null, of none parents match
         */
        getParentByClassName: function (element, parentClass) {
            var parentNode = element.parentNode;

            while (parentNode !== null) {
                if (parentNode.classList.contains(parentClass)) {
                    return parentNode;
                }
                parentNode = parentNode.parentNode;
            }
            return null;
        },
        throttle: function (func, threshold) {
            var lock = false;

            function unlock() {
                lock = false;
            }

            return function () {
                if (!lock) {
                    func.apply(this, arguments);
                    setTimeout(unlock, threshold);
                    lock = true;
                }
            };
        }
    };
});
