# Stream your audio line over HTTP
<img src="https://i.imgur.com/l8Bx3my.png">

## Required softwares:
- A virtual audio cable mod: Recommended: https://vb-audio.com/Cable/
- FFmpeg: https://ffmpeg.org/ (be available in environment variables)
- NodeJS 
### NPM modules
Use `npm install` to install all required module.  
Used modules:
- blessed
- express
- fluent-ffmpeg
- pidusage

## Forward a port for the http server
- What you set in the config.json file (http_port)

## Config:
Use this command to list your audio devices which able to stream:
```
ffmpeg -list_devices true -f dshow -i dummy
```

**config.json:**
```json
{
    "http_port" : 8080, // The main http server port
    "local_stream_url" : "233.1.1.1:9999",  // Local UDP multicast audio stream port (just pick a IPv4 multicast address)
    "audio_line" : "CABLE Output (VB-Audio Virtual Cable)", // Your streamable audio line
    "audio_api" : "dshow",   // Your system default audio api, Windows: dshow Linux: pulse or alsa
    "codec" : "libmp3lame", // FFmpeg default MP3 codec
    "bitrate" : 320,    // Stream bitrate in kbps
    "format" : "mp3",    // Stream container format (different format requires different codec)
    "monitor_interval" : 45,  // Resource monitor update interval in seconds (May result high CPU usage)
    "enable_ffmpeg_log" : true,  // Disable / Enable the FFmpeg log
    "use_ps_fetch" : false  // When true uses ps instead of proc files to fetch process information
}
```

## Start:
Just run the src/index.js with node.

## Playback:
- Use VLC and "Open network stream" or open your http server url in the browser (doesn't always work, Edge usually supports it).
- Your url is: localhost:{http_port} // for example localhost:8080

*Discord: @mcitomi / https://dc.mcitomi.hu*
<3
