define(['track', 'set'], 'playlist', function (Track, Set) {
    return {
        html: function (handler) {
            Set.get(function (playlist) {
                handler([
                    '<div class="playlist">',
                    playlist.tracks.map(Track.html).join(''),
                    '</div>'
                ].join(''));
            }.bind(this));
        }
    };
});
