define('set', function () {
    return {
        PLAYLIST_NAME: 'Playlist',
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
        prependTrack: function (track, onAdd) {
            this.putTracks([track].concat(this._playlist.tracks), onAdd);
        },
        removeTrack: function (trackId, onRemove) {
            this.putTracks(this._playlist.tracks.filter(function (track) {
                return track.id !== Number(trackId);
            }), onAdd);
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
                        SC.get('/tracks', {q: 'eminem', streamable: true}, function(tracks) {
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
