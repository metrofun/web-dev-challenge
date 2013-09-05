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