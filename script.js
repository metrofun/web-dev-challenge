// initialize client with app credentials
SC.initialize({
    client_id: 'f9ff3ee51fed2d2e0bc09d60d4e00896',
    redirect_uri: 'http://0.0.0.0:8000/callback.html'
});
var PLAYLIST_NAME = 'Playlist',
    ERROR_MSG = 'Error!';

function getTrackHtml(track) {
    return [
        '<div class="track">',
            '<div class="track-logo">',
                '<img class="track-logo__image" src="', track.artwork_url, '" alt="" />',
            '</div>',
            '<div class="track__content">',
                '<div class="track__owner">', track.user.username, '</div>',
                '<div class="track__title">', track.title, '</div>',
            '</div>',
            '<div class="track__controls">',
                '<button class="button_type_remove button" title="Remove">Remove</button>',
                '<button class="button_type_play button" title="Play">Play</button>',
            '</div>',
        '</div>'
    ].join('');
}
function drawPlaylist(playlist) {
    document.querySelector('.playlist')
        .innerHTML = playlist.tracks.map(getTrackHtml).join('');
}
SC.connect(function () {
    SC.get('/me/playlists', {limit: 1}, function(playlists, error) {
        var i;

        if (playlists[0] && playlists[0].title === PLAYLIST_NAME) {
            drawPlaylist(playlists[0]);
        } else {
            SC.get('/tracks', {q: 'eminem'}, function(tracks) {
                SC.post('/playlists', {
                    playlist: { title: PLAYLIST_NAME, tracks: tracks }
                }, drawPlaylist);
            });
        }
    });
    // SC.get('/tracks', {q: 'eminem'}, function(tracks) {
        // SC.post('/playlists', {
            // playlist: { title: 'Eminem', tracks: tracks }
        // }, function() {
            // console.log(arguments);
        // });
    // });
    // SC.post('/playlists', {
        // playlist: { title: 'My Playlist', tracks: tracks }
    // });
});
