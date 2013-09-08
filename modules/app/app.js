/*
 * Root point of application
 */
require(['playlist', 'header-search'], function (Playlist) {
    SC.initialize({
        client_id: '3136aa18c7383fa2da56f6ed33e8e8d0',
        display: 'popup',
        redirect_uri: 'http://metrofun.github.io/web-dev-challenge/callback.html'
    });
    SC.connect(function () {
        Playlist.html(function (html) {
            document.querySelector('.app__playlist').innerHTML = html;
        });
    });
});
