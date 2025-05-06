import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Image, Button, Badge, ListGroup } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

import "./styles/main.css";

export default function AudioStream() {
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const socketRef = useRef(null);
    const queueRef = useRef([]);
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);

    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem("vol")) || 0.2;
    });

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("darkmode") === "true";
    });

    const [meta, setMeta] = useState({
        title: "H.A.L. Streamer",
        author: "Built in React",
        img: "/webplayer/assets/blank.jpg",
        playedAt: 0
    });

    const [history, setHistory] = useState([]);

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
                    author: data.metaDatas.author || "www.mcitomi.hu",
                    img: data.metaDatas.img || "/assets/blank.jpg"
                });
                setHistory(data.history);
            } catch (err) {
                console.error("Metadata parsing error:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("Metadata WebSocket error:", err);
        };

        return () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: meta.title,
                artist: meta.author,
                album: "H.A.L. Streamer by mcitomi",
                artwork: [
                    { src: meta.img, sizes: "512x512", type: "image/jpeg" },
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

        socket.addEventListener('message', (event) => {
            const chunk = new Uint8Array(event.data);
            const q = queueRef.current;
            const sb = sourceBufferRef.current;

            if (!sb) return;

            if (q.length > 20) {
                console.warn("Buffer overflow, dropping old audio");
                queueRef.current = [];
                if (!sb.updating) {
                    sb.appendBuffer(chunk);
                } else {
                    queueRef.current.push(chunk);
                }
            } else if (!sb.updating && q.length === 0) {
                sb.appendBuffer(chunk);
            } else {
                q.push(chunk);
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
                                    key={meta.img}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-center"
                                >
                                    <Image src={meta.img} width={250} height={250} rounded />
                                    <h4 className="my-3">{meta.title}</h4>
                                    <h5 className="artistColor">{meta.author}</h5>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="my-3">
                            <input
                                id="volume"
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round(volume * 100)}
                                onChange={handleVolumeChange}
                                className="w250"
                            />
                            <br />
                            <p>Vol: {Math.round(volume * 100)}%</p>
                        </div>
                        <div>
                            <Button className="m-2 btnsize" onClick={handleStart} disabled={isPlaying}>Start</Button>
                            <Button className="m-2 btnsize" variant="danger" onClick={handleStop} disabled={!isPlaying}>Disconnect</Button>
                        </div>
                    </div>
                </Col>
                <Col>
                    <ListGroup as="ul">
                        <AnimatePresence initial={false}>
                            {history.map((song) => (
                                <motion.div
                                    key={`${song.playedAt}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.25 }}
                                    className="d-flex justify-content-between align-items-start p-2 my-1 rounded"
                                    style={{ backgroundColor: "#333", color: "white" }}
                                >
                                    <Image src={song.img} width={50} rounded />
                                    <div className="ms-2 me-auto">
                                        <div className="fw-bold">{song.title}</div>
                                        <span className="artistColor">{song.author}</span>
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
