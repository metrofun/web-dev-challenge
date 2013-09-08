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

/*
 * Root point of application
 */
require(['playlist', 'header-search'], function (Playlist) {
    SC.initialize({
        client_id: '3136aa18c7383fa2da56f6ed33e8e8d0',
        display: 'popup',
        redirect_uri: 'http://metrofun.github.io/web-dev-challenge/callback.html'
    });
    SC.connect(function () {
        Playlist.html(function (html) {
            document.querySelector('.app__playlist').innerHTML = html;
        });
    });
});

/*jshint white: false */
/**
 * Search block.  Responsible for a search suggest,
 * and adding tracks from suggest to the playlist
 */
define(['utils', 'playlist'], 'header-search', function (Utils, Playlist) {
    var SUGGEST_LIMIT = 5,
        // Stores last search value,
        // used to eliminate obsolete search queries callbacks
        currentSearchValue;

    function clearSearch() {
        var input = document.querySelector('.header-search__input');

        input.value = '';
        input.parentNode.querySelector('.header-search__suggest').innerHTML = '';
    }
    function suggestItems() {
        var suggestNode = this.parentNode.querySelector('.header-search__suggest'),
            searchValue = this.value;

        currentSearchValue = searchValue;

        if (this.value !== '') {
            //show loader, while loading
            suggestNode.innerHTML = [
                '<li class="header-search__suggest-item">',
                    '<img class="loader" src="modules/loader/loader.gif" />',
                '</li>'
            ].join('');

            // Search only for streamable tracks
            SC.get('/tracks', {q: searchValue, limit: SUGGEST_LIMIT, streamable: true}, function(tracks) {
                // Don't display belated results of previous search queries
                if (tracks.length && searchValue === currentSearchValue) {
                    suggestNode.innerHTML = tracks.map(function (track) {
                        return [
                            '<li class="header-search__suggest-item" data-track="',
                            encodeURI(JSON.stringify(track)),
                            '">',
                            track.title,
                            track.title,
                            '</li>'
                        ].join('');
                    }).join('');
                }
            });
        } else {
            clearSearch();
        }
    }

    Utils.delegate('.header-search__suggest-item', 'touchstart', function () {
        Playlist.add(JSON.parse(decodeURI(this.dataset.track)));
        clearSearch();
    });
    Utils.delegate('.header-search__input', 'input', suggestItems);
    Utils.delegate('.header-search__input', 'touchstart', function () {
        this.onblur = clearSearch;
    });
});

/**
 * Audio player. Responsible for playing/pausing/unpausing.
 * Plays next song, after current
 */
define(['set'], 'player', function (Set) {
    return {
        /**
         * Plays next track after current.
         * First track goes after the last
         */
        playNext: function () {
            var self = this;
            Set.get(function (playlist) {
                var tracks = playlist.tracks;

                tracks.some(function (track, index) {
                    if (Number(track.id) === self._trackId) {
                        require(['track'], function (Track) {
                            Track.play(tracks[(index + 1) % tracks.length].id);
                        });
                        return true;
                    }
                });
            });
        },
        /**
         * Pause playback
         */
        pause: function () {
            if (this._sound) {
                this._sound.pause();
            }
        },
        /**
         * Plays a track by id
         *
         * @param {String|Number} trackId
         * @param {Function} onStart
         * @param {Function} onFinish
         */
        play: function (trackId, onStart, onFinish) {
            var self = this;

            trackId = Number(trackId);
            //New track is playing
            if (this._trackId !== trackId) {
                if (this._sound) {
                    this._sound.stop();
                    this._onFinish();
                }
                this._trackId = trackId;
                this._pause = false;
                this._onFinish = onFinish;

                SC.stream("/tracks/" + trackId, {
                    onfinish: function () {
                        onFinish();
                        self.playNext();
                    }
                }, function (sound) {
                    if (trackId === self._trackId) {
                        console.log(sound);
                        self._sound = sound;
                        self._sound.play();
                        onStart();
                    } else {
                        onFinish();
                    }
                });
            //Current track pause/unpause
            } else if (this._sound) {
                if (this._pause) {
                    this._sound.play();
                    onStart();
                } else {
                    this._sound.pause();
                    onFinish();
                }
                this._pause =  !this._pause;
            }
        }
    };
});

/**
 * UI Track list. Implements tracks rearrange, by drag
 */
define(['track', 'set', 'utils'], 'playlist', function (Track, Set, Utils) {
    var ITEM_HEIGHT = 65,
        DRAG_CAPTURE_DURATION = 250, //px
        DRAG_MOVE_THRESHOLD = 1, //px
        DRAG_MOVE_THROTTLE = 200, //ms

        // cache variables, used for optimizations
        placeholderOffsetTop, parentNodeOffsetHeight,
        startY,
        lastClientY,
        startOffsetTop,
        // marker-node to be placed instead currently moved one
        placeholder,
        // item shift when drag'n'dropped
        indexShift,
        // if of drag'n'dropped track
        shiftedTrackId,
        throttledDragMove;

    function savePermute() {
        if (indexShift !== 0) {
            Set.get(function (playlist) {
                var tracks = playlist.tracks;

                tracks.some(function (track, index) {
                    var temp;

                    if (track.id === Number(shiftedTrackId)) {
                        //adjust track order in the Set after drag'n'drop
                        temp = tracks[index];
                        tracks[index] = tracks[index + indexShift];
                        tracks[index + indexShift] = temp;
                        return true;
                    }
                });

                //save new track list
                Set.putTracks(tracks, function () {
                    console.log('saved');
                });
            });
        }
    }

    function dragStop() {
        this.style.position = '';
        this.style.top = '';
        this.classList.remove('track_state_move');
        this.removeEventListener('touchmove', throttledDragMove);
        this.removeEventListener('touchend', dragStop);
        this.removeEventListener('touchcancel', dragStop);
        this.parentNode.replaceChild(this, placeholder);
        savePermute();
    }
    function dragMove(e) {
        e.preventDefault();
        if (Math.abs(lastClientY - e.targetTouches[0].clientY) > DRAG_MOVE_THRESHOLD) {
            var parentNode = this.parentNode,
                diff = (e.targetTouches[0].clientY - startY),
                offsetTop = startOffsetTop + diff;

            lastClientY = e.targetTouches[0].clientY;

            // don't exit playlist area
            if (offsetTop > 0 && offsetTop < parentNodeOffsetHeight - ITEM_HEIGHT) {
                this.style.top = offsetTop + 'px';

                if (Math.abs(placeholderOffsetTop - offsetTop) > Math.ceil(ITEM_HEIGHT / 2)) {
                    startY = e.targetTouches[0].clientY;
                    startOffsetTop += diff;
                    if (diff > 0) {
                        indexShift++;
                        parentNode.insertBefore(
                            placeholder,
                            placeholder.nextSibling && placeholder.nextSibling.nextSibling
                            );
                    } else {
                        // Don't count shift,
                        // when a pivot point is the current node
                        if (placeholder.previousSibling !== this) {
                            indexShift--;
                        }
                        parentNode.insertBefore(placeholder, placeholder.previousSibling);
                    }
                    placeholderOffsetTop = placeholder.offsetTop;
                }
            } else {
                dragStop.call(this);
            }
        }
    }
    throttledDragMove = Utils.throttle(dragMove, DRAG_MOVE_THROTTLE);
    function dragStart(e) {
        parentNodeOffsetHeight = this.parentNode.offsetHeight;
        indexShift = 0;
        startY = e.targetTouches[0].clientY;
        lastClientY = startY;
        shiftedTrackId = this.dataset.id;
        startOffsetTop = this.offsetTop;
        placeholder = Utils.createHtmlElement('<div class="playlist__placeholder track"></div>');
        this.classList.add('track_state_move');
        this.style.position = 'absolute';
        this.addEventListener('touchmove', throttledDragMove);
        this.addEventListener('touchend', dragStop);
        this.addEventListener('touchcancel', dragStop);
        this.parentNode.insertBefore(placeholder, this.nextSibling);
        placeholderOffsetTop = placeholder.offsetTop;
    }

    Utils.delegate('.playlist .track', 'touchstart', function (e) {
        var startX = e.targetTouches[0].clientX,
            startY = e.targetTouches[0].clientY,
            timeoutId;

        function onMove(e) {
            if (Math.abs(startX - e.targetTouches[0].clientX) > DRAG_MOVE_THRESHOLD
            || Math.abs(startY - e.targetTouches[0].clientY) > DRAG_MOVE_THRESHOLD) {
                onCancel();
            }
        }
        // cancel capture
        function onCancel() {
            clearTimeout(timeoutId);
            this.removeEventListener('touchmove', onMove);
            this.removeEventListener('touchend', onCancel);
            this.removeEventListener('touchcancel', onCancel);
        }

        timeoutId = setTimeout(function () {
            //captured
            dragStart.call(this, e);
            this.removeEventListener('touchmove', onMove);
        }.bind(this), DRAG_CAPTURE_DURATION);

        this.addEventListener('touchmove', onMove);
        this.addEventListener('touchend', onCancel);
        this.addEventListener('touchcancel', onCancel);
    });

    return {
        /**
         * Generates html for playlist
         *
         * @param {Function} handler Will be called with html, as a first argument
         */
        html: function (handler) {
            Set.get(function (playlist) {
                handler([
                    '<div class="playlist">',
                    playlist.tracks.map(Track.html).join(''),
                    '</div>'
                ].join(''));
            }.bind(this));
        },
        /**
         * Adds a track to the playlist,
         * and saves changes
         *
         * @param {Object} track Data describing a track
         */
        add: function (track) {
            var playListNode = document.querySelector('.playlist');

            Set.prependTrack(track, function () {
                playListNode.insertBefore(
                    Utils.createHtmlElement(Track.html(track)),
                    playListNode.firstChild
                );
            });
        }
    };
});

/**
 * Responsible for storing/updating/fetching of playlist on the server
 */
define('set', function () {
    return {
        PLAYLIST_NAME: 'Playlist',
        /**
         * Updates tracks of the playlist
         *
         * @param {Array} tracks
         * @param {Function} onPut Success callback
         */
        putTracks: function (tracks, onPut) {
            this._playlist.tracks = tracks;
            SC.put(
                this._playlist.uri,
                {
                    playlist: {
                        tracks: tracks.map(function (track) {
                            return {
                                id: track.id
                            };
                        })
                    }
                },
                onPut
            );
        },
        /**
         * Adds first track, and saves changes
         *
         * @param {Object} track
         * @param {onAdd} Success callback
         */
        prependTrack: function (track, onAdd) {
            this.putTracks([track].concat(this._playlist.tracks), onAdd);
        },
        /**
         * Removes track by id, nd saves changes
         *
         * @param {String|Number} trackId
         * @param {Function} onRemove Success callback
         */
        removeTrack: function (trackId, onRemove) {
            this.putTracks(this._playlist.tracks.filter(function (track) {
                return track.id !== Number(trackId);
            }), onRemove);
        },
        /**
         * Retrieves 'Playlist' set from server,
         * or creates one if it does't exist.
         *
         * @param {Function} handler Will be called with playlist object, as a first argument
         */
        get: function (handler) {
            var self = this;

            function callback(playlist) {
                self._playlist = playlist;
                handler(playlist);
            }

            if (!this._playlist) {
                SC.get('/me/playlists', {limit: 1}, function (playlists) {
                    if (playlists[0] && playlists[0].title === self.PLAYLIST_NAME) {
                        callback(playlists[0]);
                    } else {
                        SC.get('/tracks', {q: 'eminem', streamable: true, limit: 10}, function (tracks) {
                            SC.post('/playlists', {
                                playlist: { title: self.PLAYLIST_NAME, tracks: tracks }
                            }, callback);
                        });
                    }
                }.bind(this));
            } else {
                handler(this._playlist);
            }
        }
    };
});

/*jshint white: false */
/**
 * UI block for tracklist item.
 * Handles play/delete buttons, based on event delegation.
 */
define(['set', 'utils', 'player'], 'track', function (Set, Utils, Player) {
    var Track = {
        /**
         * @param {String|Number|Object} track Track node, or track ID
         */
        play: function (track) {
            var trackId, trackNode;

            if (typeof track === 'object') {
                trackNode = track;
                trackId = trackNode.dataset.id;
            } else {
                trackId = track;
                trackNode = document.querySelector('.track[data-id="' + trackId + '"]');
            }

            Player.play(trackId, function () {
                trackNode.classList.add('track_state_playing');
            }, function () {
                trackNode.classList.remove('track_state_playing');
            });
        },
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
    };

    Utils.delegate('.track .button_type_play', 'touchstart', function () {
        var trackNode = Utils.getParentByClassName(this, 'track');

        Track.play(trackNode);
    });

    Utils.delegate('.playlist .button_type_remove', 'touchstart', function () {
        var trackNode = Utils.getParentByClassName(this, 'track'),
            trackId = trackNode.dataset.id;

        trackNode.classList.add('track_state_removal');

        Set.removeTrack(trackId, function () {
            trackNode.parentNode.removeChild(trackNode);
        });
    });

    return Track;
});

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
