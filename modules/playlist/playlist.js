define(['utils', 'track'], 'playlist', function (Utils, Track) {
    var PLAYLIST_NAME = 'Playlist',
        currentPlaylist;

    Utils.delegate('.playlist .button_type_remove', 'touchend', function () {
        var trackNode = Utils.getParentByClassName(this, 'track'),
            trackId = trackNode.dataset.id;

        trackNode.classList.add('track_progress_yes');

        SC.put(
            currentPlaylist.uri,
            {
                playlist: {
                    tracks: currentPlaylist.tracks.filter(function (track) {
                        return track.id !== Number(trackId);
                    }).map(function (track) {
                        return {
                            id: track.id
                        };
                    })
                }
            },
            function () {
                trackNode.parentNode.removeChild(trackNode);
            }
        );
    });

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
        },
        html: function (handler) {
            this.get(function (playlist) {
                currentPlaylist = playlist;
                handler([
                    '<div class="playlist">',
                    playlist.tracks.map(Track.html).join(''),
                    '</div>'
                ].join(''));
            });
        }
    };
});
