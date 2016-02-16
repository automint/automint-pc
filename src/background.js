chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create('public/index.html', {
        'outerBounds': {
            'width': 800,
            'height': 600
        },
        state: "maximized"        
    });
});