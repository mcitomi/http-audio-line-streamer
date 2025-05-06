# Stream your audio line over HTTP 💫
​H.A.L. Streamer is a simple Node.js-based application that allows you to stream an audio line (such as a virtual sound card or microphone) over HTTP or / and websocket. The project aims to provide an easy-to-use and configurable solution for streaming audio data and optional song metadata over websocket.

<img src="https://imgur.com/ES5kpwZ.png">

## 🚀 Quickstart:
- Clone this repo to your computer or download it.
- Install the required softwares and node modules.
- Configurate your server.
- Just run the src/index.js with node .
- Be happy c:

### ⌨ Keybinds:
- `[q] [escape] [C-c]` : Close the program
- `[tab]` : Select screen
- `[Up] [Down] [PageUp] [PageDown]` : Scroll the log in the selected screen

## 🌐 Forward a port for the http server
- What you set in the config.json file (http_port)

## 📦 Required softwares:
- A virtual audio cable mod: Recommended: https://vb-audio.com/Cable/ (or https://vb-audio.com/Voicemeeter/)
- FFmpeg: https://ffmpeg.org/ (be available in environment variables)
- NodeJS 

### NPM modules
Use `npm install` to install all required module.  
Used modules:
- blessed
- express
- pidusage
- ws

## 🔊 Playback:
- Use VLC and "Open network stream" and paste your url or open your http server url in the browser and enjoy the websocket stream (if enabled in your config :)
- Your url is: http://localhost:{http_port} // for example http://localhost:8080/
- To reduce latency, set the "network-caching" setting in VLC's settings to a lower value, e.g. 200ms. (usually the websocket is faster).

## 👨‍💻 Config:
Use this command to list your audio devices which able to stream:
```
ffmpeg -list_devices true -f dshow -i dummy
```

**config.json:**
```json
{
    "http_port": 8080, // The main http server port
    "stream": {
        "ws_enabled" : true,    // Enable websocket stream and webpage
        "http_enabled" : true,  // Enable the HTTP stream
        "audio_line": "CABLE Output (VB-Audio Virtual Cable)",  // Your streamable audio input line name
        "audio_api": "dshow",   // Your system audio api, Windows: dshow Linux: pulse or alsa
        "codec": "libmp3lame",  // FFmpeg audio codec (libmp3lame for mp3)
        "bitrate": 320, // Stream bitrate in kbps
        "format": "mp3" // Stream container format (different format requires different codec)
    },
    "monitoring": {
        "refresh_interval": 45, // Resource monitor update interval in seconds (May result high CPU usage)
        "enable_ffmpeg_log": true,  // Disable / Enable FFmpeg log
        "ffmpeg_log_length": 50,    // Maximum length of FFmpeg log (to save memory)
        "screen_max_scrollback": 1000,  // Screen module max scrollback size
        "use_ps_fetch": false,   // When true uses ps instead of proc files to fetch process information
        "save_main_log" : true,    // Disable / Enable to save the main "Log" screen values to a log file
        "save_ffmpeg_log" : false,   // Disable / Enable to save the "FFmpeg Log" screen values to a log file
        "save_resource_log" : false  // Disable / Enable to save resource usage to a log file
    },
    "meta_infos" : {
        "enabled" : true,   // Enable to get meta informations from frontend
        "api_url" : "http://localhost:8181/api/current",    // Your api server link (for example: https://github.com/mcitomi/spotify-song-display-api ).
        "title_path" : "item.name", // The title location inside your api (example: https://github.com/mcitomi/spotify-song-display-api/blob/main/src/types/spotifyCurrentPlaying.d.ts ).
        "author_path" : "item.artists[0].name", // Author's name location
        "album_pic_path" : "item.album.images[0].url",  // Album / song pic url location
        "refresh_interval" : 3, // The interval when the application calls the API in seconds.
        "max_history_length" : 50   // Maximum length of music history.
    }
}
```
- Make sure the metadata server configuration and paths are valid, and the API responds with a 404 status if a song doesn't play or if no new songs are found.


# 📝 Changelog
### 1.4.1.
- Impressive frontend update: React based web application added to play websocket stream.
- Config settings added for frontend song display.
- Song metadata broadcaster added to backend + websocket updated.

<img src="https://imgur.com/8W5IDS4.png">

#### Plans:
- Improved synchronization between clients with buffer size.
- Volume control from another client via client code (desktop pc audio from mobile).
- Spotify / Spicetify mod integration (search bar, song request, queue).
- Display statistics in frontend: number of stream listeners, client latency and IP address, server cpu and memory load.
- Darkmode / color themes.
- Music progress bar in frontend.

### 1.4.0.
- Removed UDP multicast -> using process pipes.
- Code Refactor: FFmpeg, client counter, HTTP and WC have been placed in separate modules.
- Websocket Stream option added to reduce delay.
- A dedicated web player has been created for the websocket stream, which can be accessed by typing https://localhost:8080/, which will redirect to https://localhost:8080/webplayer/ if you open it in a browser instead of VLC. (The HTTP stream is still available through VLC at https://localhost:8080/).
- The web player: uses vanilla javascript and html, saves volume and theme settings to local storage (the plan is to create a simple react-based application for it in the future, the current one is just a test/sample)
- Removed fluent-ffmpeg module, using only native FFmpeg as child process.

### 1.3.8.
- Ability to log everything to /logs directory. ✨ (main screen, FFmpeg console and resource monitor).

### 1.3.7.
- Monitoring updated: Handle childprocess crashes and design improved.
- FFmpeg crash handler and crash log file added.
- Logger module: Added log types enum and log file creator.
- Added tags to package.
- Updated readme docs and emotes 🌟💘

### 1.3.6.
- Added: log / screen scrollback.
- Screen change with tab.
- Option to change FFmpeg and screen default log scrollback size.
- config file structure refactored.
- Updated readme: Added Quickstart, better config example and Changelog :)

### 1.3.5.
- Added alternative process stat fetching method (usePs).
- Option to disable FFmpeg log screen (to save CPU and memory usage).
- Memory leak fixed in FFmpeg log.

### 1.3.4.
- Added better FFmpeg logging to save resources and improve display.

### 1.3.3.
- Better connection messages in Logs.
- H.A.L. （づ￣3￣）づ╭❤️～
- FFmpeg log screen has been changed to a list type and a more efficient update method has been added.
- Added new CPU monitor function instead of "pidusage" module to save CPU load.
- Displays "Heap" memory usage.

### 1.3.2.
- Added new timestamp method for handling timezones.
- Tried to optimize the "pidusage" module.

### 1.3.1.
- Resource monitor labels updated.
- Removed useless log tests.
- Added new resource checker function.
- Ability to disable FFmpeg log screen and save CPU load.

### 1.3.0.
- Added a new GUI with blessed module.
- Refactoring codebase to module type standard.
- Added new log style with screens.
- Resource monitor added with custom refresh interval.
- FFmpeg stream reloacted to Node spawn child process.
- Bug fixed: The FFmpeg process does not stop with the main process.

### 1.2.
- Client / listener counter added.
- More client info logged (ip, client ~ user agent).
- New client disconnect message.

### 1.1.
- Publish to GitHub. 🎉
- Ability to configure custom FFmpeg settings.
- New log messages, logger function.
- Added readme.md and example config.   

### 1.0.
- A basic http server.
- Bult in FFmpeg stream method with Node exec.

# 🍻 About:
### Dev(s): 
- mcitomi

  *Discord: @mcitomi / https://dc.mcitomi.hu*

### Testers:
- Decsi01
- gyapjashabcukor
- kiwisfagyi <small>~ alterlany</small>

<3
