define(['set'], 'player', function (Set) {
    return {
        playNext: function () {
            var self = this;
            Set.get(function (playlist) {
                var nextTrackId,
                    tracks = playlist.tracks;

                tracks.some(function (track, index) {
                    if (Number(track.id) === self._trackId) {
                        require(['track'], function (Track) {
                            Track.play(tracks[(index + 1) % tracks.length].id);
                        });
                        return true;
                    }
                })
            });
        },
        pause: function () {
            if (this._sound) {
                this._sound.pause();
            }
        },
        play: function (trackId, onStart, onFinish) {
            var self = this;

            trackId = Number(trackId);
            //New track is playing
            if (this._trackId !== trackId) {
                if (this._sound) {
                    this._sound.stop();
                    this._onFinish();
                }
                this._trackId = trackId;
                this._pause = false;
                this._onFinish = onFinish;

                SC.stream("/tracks/" + trackId, {
                    onfinish: function () {
                        onFinish();
                        self.playNext();
                    }
                }, function(sound){
                    if (trackId === self._trackId) {
                        self._sound = sound;
                        self._sound.play();
                        onStart();
                    } else {
                        onFinish();
                    }
                });
            //Current track pause/unpause
            } else if (this._sound) {
                if (this._pause) {
                    this._sound.play();
                    onStart();
                } else {
                    this._sound.pause();
                    onFinish();
                }
                this._pause =  !this._pause;
            }
        }
    };
});
