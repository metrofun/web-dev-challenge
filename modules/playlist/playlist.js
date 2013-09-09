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
