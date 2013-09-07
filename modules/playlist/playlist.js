define(['track', 'set', 'utils'], 'playlist', function (Track, Set, Utils) {
    var ITEM_HEIGHT = 65,
        startY, startOffsetTop, placeholder;

    function dragStop () {
        this.style.position = '';
        this.style.top = '';
        this.classList.remove('track_state_move');
        this.removeEventListener('touchmove', dragMove);
        this.removeEventListener('touchend', dragStop);
        this.parentNode.replaceChild(this, placeholder);
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
                parentNode.insertBefore(
                    placeholder,
                    diff > 0 ? (placeholder.nextSibling || {}).nextSibling:placeholder.previousSibling
                );
            }
        } else {
            dragStop.call(this);
        }
    }
    function dragStart(e) {
        startY = e.targetTouches[0].clientY;
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
        html: function (handler) {
            Set.get(function (playlist) {
                handler([
                    '<div class="playlist">',
                    playlist.tracks.map(Track.html).join(''),
                    '</div>'
                ].join(''));
            }.bind(this));
        },
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
