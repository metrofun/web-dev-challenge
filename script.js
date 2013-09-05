(function (global) {
    var modules = {},
        pendingRequires = [];

    function rerunPendingRequires() {
        var length = pendingRequires.length,
            pendingRequire;

        while (length--) {
            pendingRequire = pendingRequires.shift();
            global.require(pendingRequire.dependences, pendingRequire.callback);
        }
    }


    global.require = function (dependences, callback) {
        var resolvedDeps = [];

        dependences.forEach(function (moduleName) {
            if (modules[moduleName]) {
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

require(['playlist', 'track'], function (Playlist, Track) {
    SC.initialize({
        client_id: 'f9ff3ee51fed2d2e0bc09d60d4e00896',
        redirect_uri: 'http://0.0.0.0:8000/callback.html'
    });
    SC.connect(function () {
        Playlist.get(function (playlist) {
            document.querySelector('.playlist')
                .innerHTML = playlist.tracks.map(Track.html).join('');
        });
    });
});

define('playlist', function () {
    var PLAYLIST_NAME = 'Playlist';

    return {
        get: function (handler) {
            SC.get('/me/playlists', {limit: 1}, function(playlists, error) {
                var i;

                if (playlists[0] && playlists[0].title === PLAYLIST_NAME) {
                    handler(playlists[0]);
                } else {
                    SC.get('/tracks', {q: 'eminem'}, function(tracks) {
                        SC.post('/playlists', {
                            playlist: { title: PLAYLIST_NAME, tracks: tracks }
                        }, handler);
                    });
                }
            });
        }
    };
});

define(['utils'], 'track', function (Utils) {
        Utils.delegate('.track .button_type_remove', 'touchend', function () {
            console.log(Utils.getParentByClassName(this, 'track').dataset.id);
        });
    return {
        html: function (track) {
            return [
                '<div class="track" data-id="', track.id, '">',
                    '<div class="track-logo">',
                        '<img class="track-logo__image" src="',
                        track.artwork_url || track.waveform_url,
                        '" alt="" />',
                    '</div>',
                    '<div class="track__content">',
                        '<div class="track__owner">', track.user.username, '</div>',
                        '<div class="track__title">', track.title, '</div>',
                    '</div>',
                    '<div class="track__controls">',
                        '<button class="button_type_remove button" title="Remove"></button>',
                        '<button class="button_type_play button" title="Play"></button>',
                    '</div>',
                '</div>'
            ].join('');
        }
    }
});

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
