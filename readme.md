# Stream your audio line over HTTP 💫
​H.A.L. Streamer is a simple Node.js-based application that allows you to stream an audio line (such as a virtual sound card or microphone) over HTTP. The project aims to provide an easy-to-use and configurable solution for streaming audio data.

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
- fluent-ffmpeg
- pidusage

## 🔊 Playback:
- Use VLC and "Open network stream" and paste your url or open your http server url in the browser (doesn't always work, Edge usually supports it).
- Your url is: http://localhost:{http_port} // for example http://localhost:8080/
- To reduce latency, set the "network-caching" setting in VLC's settings to a lower value, e.g. 200ms.

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
        "local_url": "233.1.1.1:9999",  // Local UDP multicast audio stream port (just pick a IPv4 multicast address)
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
    }
}
```

# 📝 Changelog
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

💌 *Discord: @mcitomi / https://dc.mcitomi.hu*
<3

Plans:
- Kliensek közti szinkronra: Mindenkinek bufferel pl 5 másodpercet, de akinek rosszabb a gépe vagy valami miatt elcsúszna a hang annak kisebb buffer maradjon így ugyan ott járna. (így nem a real time adatfolyamot próbáljuk olvasni). -> idk hogyan lehetne össze syncelni így ennyire

- Spotify lekérés zene appot írni, ami api-t szolágáltat, ebbe az appba meg meg lehessen adni configba egy api url-t amit megjelenít mint zene cím/kép stb a webes lejátszó oldalon. (text contentet adjon csak vissza az api, és azt jelenítse meg)
