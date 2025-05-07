import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Image, Button, Badge, ListGroup, ProgressBar } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

import DelaySelector from "./components/DelaySelector.jsx";

import "./styles/main.css";

export default function AudioStream() {
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const socketRef = useRef(null);
    const queueRef = useRef([]);
    const audioRef = useRef(null);


    const [isPlaying, setIsPlaying] = useState(false);

    const [queueBuffer, setQueueBuffer] = useState(250);

    const queueBufferRef = useRef(queueBuffer);

    const [state, setState] = useState({
        progress: "0:00",
        duration: "0:00"
    });

    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem("vol")) || 0.2;
    });

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("darkmode") === "true";
    });

    const [meta, setMeta] = useState({
        title: "H.A.L. Streamer",
        author: ["Built in React"],
        img: ["/webplayer/assets/blank.jpg"],
        playedAt: 0,
        url: "https://mcitomi.hu/",
        artistUrl: ["https://mcitomi.hu/"],
        durationMs: 0,
        progressMs: 0,
        percent: 0,
        connectionDate: 0
    });

    const [history, setHistory] = useState([]);

    function setStreamDelay(size) {
        console.log(`New buffer size set: ${size}`);
        setQueueBuffer(size);
    }

    useEffect(() => {
        queueBufferRef.current = queueBuffer;
    }, [queueBuffer]);

    useEffect(() => {
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        mediaSource.addEventListener('sourceopen', () => {
            console.log("MediaSource opened.");
            const sb = mediaSource.addSourceBuffer('audio/mpeg');
            sb.mode = 'sequence';
            sourceBufferRef.current = sb;

            sb.addEventListener('updateend', () => {
                const q = queueRef.current;
                if (q.length > 0 && !sb.updating) {
                    sb.appendBuffer(q.shift());
                }
            });
        });

        if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSource);
        }
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        localStorage.setItem("vol", volume.toString());
    }, [volume]);

    useEffect(() => {
        const ws = new WebSocket(`ws://${location.host == "localhost:3000" ? "localhost:9099" : location.host}/metadata`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMeta({
                    title: data.metaDatas.title || "Unknown",
                    author: data.metaDatas.author || ["www.mcitomi.hu"],
                    img: data.metaDatas.img || ["/assets/blank.jpg"],
                    url: data.metaDatas.url || "https://mcitomi.hu/",
                    artistUrl: data.metaDatas.artistUrl || ["https://mcitomi.hu/"],
                    durationMs: data.metaDatas.durationMs || 0,
                    progressMs: data.metaDatas.progressMs + (data.connectionDate - data.metaDatas.playedAt) || 0,
                    playedAt: data.metaDatas.playedAt,
                    connectionDate: data.connectionDate
                });
                setHistory(data.history);
            } catch (err) {
                console.error("Metadata parsing error:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("Metadata WebSocket error:", err);
        };

        const interval = setInterval(() => {
            setMeta(prev => {
                const newProgress = prev.progressMs + 1000;
                return {
                    ...prev,
                    progressMs: Math.min(newProgress, prev.durationMs),
                    percent: Math.floor(prev.durationMs > 0 ? (newProgress / prev.durationMs) * 100 : 0)
                };
            });
        }, 1000);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);

    function millisToMinutesAndSeconds(millis) {
        const minutes = Math.floor(millis / 60000);
        const seconds = Math.floor((millis % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: meta.title,
                artist: meta.author.join(", "),
                album: "H.A.L. Streamer by mcitomi",
                artwork: [
                    { src: meta.img[0], sizes: "512x512", type: "image/jpeg" },
                ]
            });

            navigator.mediaSession.setActionHandler("play", () => {
                handleStart();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                handleStop();
            });

            navigator.mediaSession.setActionHandler("stop", () => {
                handleStop();
            });
        }

        setState({
            duration: millisToMinutesAndSeconds(meta.durationMs),
            progress: millisToMinutesAndSeconds(meta.progressMs)
        });
    }, [meta]);

    const handleStart = () => {
        setIsPlaying(true);

        queueRef.current = [];
        sourceBufferRef.current = null;
        mediaSourceRef.current = null;

        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSource);
            audioRef.current.load();
        }

        mediaSource.addEventListener('sourceopen', () => {
            const sb = mediaSource.addSourceBuffer('audio/mpeg');
            sb.mode = 'sequence';
            sourceBufferRef.current = sb;

            sb.addEventListener('updateend', () => {
                const q = queueRef.current;
                if (q.length > 0 && !sb.updating) {
                    sb.appendBuffer(q.shift());
                }
            });
        });

        const socket = new WebSocket(`ws://${location.host == "localhost:3000" ? "localhost:9099" : location.host}/ws-stream`);
        socket.binaryType = 'arraybuffer';
        socketRef.current = socket;

        socket.addEventListener('open', () => {
            console.log("WebSocket connected.");
            audioRef.current?.play().catch(err => {
                console.error("Autoplay blocked:", err.message);
            });
        });

        console.log(`Queue buffer size: ${queueBuffer}`);

        socket.addEventListener('message', (event) => {
            const chunk = new Uint8Array(event.data);
            const q = queueRef.current;
            const sb = sourceBufferRef.current;

            if (!sb) return;

            if (!sb.updating && q.length === 0) {
                sb.appendBuffer(chunk);
            } else if (q.length < queueBufferRef.current) {
                q.push(chunk);
            } else {
                console.warn("Queue is full. Dropping incoming chunk.");
            }
        });

        socket.addEventListener('error', err => {
            console.error("WebSocket error:", err);
        });
    };

    const handleStop = () => {
        if (socketRef.current) {
            socketRef.current.close();

            console.log("WebSocket disconnected.");
        }
        if (audioRef.current) {
            audioRef.current.pause();
            queueRef.current = [];
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value) / 100;
        setVolume(newVolume);
    };

    useEffect(() => {
        const el = document.getElementById("volume");
        if (!el) return;

        const handler = (e) => {
            e.preventDefault();
            let current = Math.round(volume * 100);
            current += e.deltaY < 0 ? 1 : -1;
            current = Math.max(0, Math.min(100, current));
            setVolume(current / 100);
        };

        el.addEventListener("wheel", handler, { passive: false });

        return () => {
            el.removeEventListener("wheel", handler);
        };
    }, [volume]);

    return (
        <Container>
            <Row>
                <Col lg={6}>
                    <div className="text-center songCard">
                        <div className="songImg">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={meta.img[0]}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-center"
                                >
                                    <Image src={meta.img[0]} width={250} height={250} rounded />
                                    <a href={meta.url} target="_blank" rel="noopener noreferrer">
                                        <h4 className="my-3 songTitle">{meta.title}</h4>
                                    </a>
                                    <div className="artists">
                                        {
                                            meta.author.map((author, i) => (
                                                <React.Fragment key={i}>
                                                    <a href={meta.artistUrl[i]} target="_blank" rel="noopener noreferrer">
                                                        <h5 className="artistColor d-inline">{author}</h5>
                                                    </a>
                                                    {i < meta.author.length - 1 && <span className="artistColor">, </span>}
                                                </React.Fragment>
                                            ))
                                        }
                                    </div>

                                    <div>
                                        <p className="progressBar">
                                            <span className="progressSec">{state.progress}</span>
                                            <span className="durationSec">{state.duration}</span>
                                        </p>
                                        <ProgressBar className="progressBar my-3" now={meta.percent} />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div>
                            <Button className="m-2 btnsize btn-sm" onClick={handleStart} disabled={isPlaying}>Start</Button>

                            <Button className="m-2 btnsize btn-sm" variant="danger" onClick={handleStop} disabled={!isPlaying}>Disconnect</Button>

                            <DelaySelector onChange={(val) => setStreamDelay(val)} />
                        </div>
                        <div className="my-3" id="volume">
                            <p className="volumeLabel">Volume: {Math.round(volume * 100)}%</p>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round(volume * 100)}
                                onChange={handleVolumeChange}
                                className="w250 volumeBar"
                            />
                        </div>

                    </div>
                </Col>
                <Col>
                    <ListGroup as="ul">
                        <AnimatePresence initial={false}>
                            {history.map((song, index) => (
                                <motion.div
                                    key={`${song.playedAt}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.25 }}
                                    className="d-flex justify-content-between align-items-start p-2 my-1 rounded"
                                    style={{ backgroundColor: "#333", color: "white" }}
                                >
                                    <Image src={song.img[index] ? song.img[index] : song.img[0]} width={50} rounded />
                                    <div className="ms-2 me-auto">
                                        <a href={song.url} target="_blank" rel="noopener noreferrer">
                                            <div className="fw-bold songTitle">{song.title}</div>
                                        </a>
                                        <div className="artists">
                                            {
                                                song.author.map((author, i) => (
                                                    <React.Fragment key={i}>
                                                        <a href={song.artistUrl[i]} target="_blank" rel="noopener noreferrer">
                                                            <span className="artistColor">{author}</span>
                                                        </a>
                                                        {i < song.author.length - 1 && <span className="artistColor">, </span>}
                                                    </React.Fragment>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <Badge bg="dark" className="artistColor" pill>
                                        {new Date(song.playedAt).toLocaleString(navigator.language || navigator.browserLanguage)}
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </ListGroup>
                </Col>
            </Row>
            <audio ref={audioRef} />
        </Container>
    );
}
