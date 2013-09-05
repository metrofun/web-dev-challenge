define('track', function () {
    return {
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
    }
});
