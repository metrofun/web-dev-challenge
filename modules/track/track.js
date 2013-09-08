/**
 * UI block for tracklist item.
 * Handles play/delete buttons, based on event delegation.
 */
define(['set', 'utils', 'player'], 'track', function (Set, Utils, Player) {
    var Track = {
        /**
         * @param {String|Number|Object} track Track node, or track ID
         */
        play: function (track) {
            var trackId, trackNode;

            if (typeof track === 'object') {
                trackNode = track;
                trackId = trackNode.dataset.id;
            } else {
                trackId = track;
                trackNode = document.querySelector('.track[data-id="' + trackId + '"]');
            }

            Player.play(trackId, function () {
                trackNode.classList.add('track_state_playing');
            }, function () {
                trackNode.classList.remove('track_state_playing');
            });
        },
        html: function (track) {
            return [
                '<div class="track" data-id="', track.id, '">',
                    '<div class="track-logo">',
                        '<img class="track-logo__image" src="',
                        track.artwork_url || track.waveform_url,
                        '" alt="" />',
                    '</div>',
                    '<div class="track__content">',
                        '<div class="track__owner">', track.user.username, '</div>',
                        '<div class="track__title">', track.title, '</div>',
                    '</div>',
                    '<div class="track__controls">',
                        '<button class="button_type_remove button" title="Remove"></button>',
                        '<button class="button_type_play button" title="Play"></button>',
                    '</div>',
                '</div>'
            ].join('');
        }
    };

    Utils.delegate('.track .button_type_play', 'touchstart', function () {
        var trackNode = Utils.getParentByClassName(this, 'track');

        Track.play(trackNode);
    });

    Utils.delegate('.playlist .button_type_remove', 'touchstart', function () {
        var trackNode = Utils.getParentByClassName(this, 'track'),
            trackId = trackNode.dataset.id;

        trackNode.classList.add('track_state_removal');

        Set.removeTrack(trackId, function () {
            trackNode.parentNode.removeChild(trackNode);
        });
    });

    return Track;
});
