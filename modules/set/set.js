define('set', function () {
    return {
        PLAYLIST_NAME: 'Playlist',
        removeTrack: function (trackId, onRemove) {
            SC.put(
                this._playlist.uri,
                {
                    playlist: {
                        tracks: this._playlist.tracks.filter(function (track) {
                            return track.id !== Number(trackId);
                        }).map(function (track) {
                            return {
                                id: track.id
                            };
                        })
                    }
                },
                onRemove
            );
        },
        get: function (handler) {
            var self = this;

            function callback (playlist) {
                self._playlist = playlist;
                handler(playlist);
            }

            if (!this._playlist) {
                SC.get('/me/playlists', {limit: 1}, function(playlists, error) {
                    var i;

                    if (playlists[0] && playlists[0].title === this.PLAYLIST_NAME) {
                        callback(playlists[0]);
                    } else {
                        SC.get('/tracks', {q: 'eminem'}, function(tracks) {
                            SC.post('/playlists', {
                                playlist: { title: PLAYLIST_NAME, tracks: tracks }
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
