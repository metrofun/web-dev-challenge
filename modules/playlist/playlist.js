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
