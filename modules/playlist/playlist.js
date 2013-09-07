define(['track', 'set', 'utils'], 'playlist', function (Track, Set, Utils) {
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
