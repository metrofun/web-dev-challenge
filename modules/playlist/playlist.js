/**
 * UI Track list. Implements tracks rearrange, by drag
 */
define(['track', 'set', 'utils'], 'playlist', function (Track, Set, Utils) {
    var ITEM_HEIGHT = 65,

        startY,
        startOffsetTop,
        // marker-node to be placed instead currently moved one
        placeholder,
        // item shift when drag'n'dropped
        indexShift,
        // if of drag'n'dropped track
        shiftedTrackId;

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

    function dragStop () {
        this.style.position = '';
        this.style.top = '';
        this.classList.remove('track_state_move');
        this.removeEventListener('touchmove', dragMove);
        this.removeEventListener('touchend', dragStop);
        this.parentNode.replaceChild(this, placeholder);
        savePermute();
    }
    function dragMove (e) {
        var parentNode = this.parentNode,
            diff = (e.targetTouches[0].clientY - startY),
            offsetTop = startOffsetTop + diff;

        // don't exit playlist area
        if (offsetTop > 0 && offsetTop < parentNode.offsetHeight - ITEM_HEIGHT) {
            this.style.top = offsetTop + 'px';

            if (Math.abs(placeholder.offsetTop - offsetTop) > Math.ceil(ITEM_HEIGHT / 2)) {
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
            }
        } else {
            dragStop.call(this);
        }
    }
    function dragStart(e) {
        indexShift = 0;
        startY = e.targetTouches[0].clientY;
        shiftedTrackId = this.dataset.id;
        startOffsetTop = this.offsetTop;
        placeholder = Utils.createHtmlElement('<div class="playlist__placeholder track"></div>');
        this.classList.add('track_state_move');
        this.style.position = 'absolute';
        this.addEventListener('touchmove', dragMove);
        this.addEventListener('touchend', dragStop);
        this.parentNode.insertBefore(placeholder, this.nextSibling);
    };
    Utils.delegate('.playlist .track', 'touchstart', dragStart);

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
