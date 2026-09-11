import socket from "./socketClient.js";

const PEER_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

export function initScreenShare({
    onRemoteStream,
    onRemoteStart,
    onRemoteStop,
    onError
}) {
    const hostPeers = new Map();
    const earlyCandidates = new Map();

    let localStream = null;
    let viewerPeer = null;
    let remoteStream = null;
    let activeSharerId = null;

    const handleScreenStarted = ({ sharerId }) => {
        activeSharerId = sharerId;

        if (sharerId !== socket.id) {
            onRemoteStart();
        }
    };

    const handleViewerReady = ({ viewerId }) => {
        if (localStream) {
            createOfferForViewer(viewerId);
        }
    };

    const handleOffer = async ({ sharerId, description }) => {
        try {
            activeSharerId = sharerId;
            closeViewerPeer();
            viewerPeer = createPeer(sharerId, false);
            await viewerPeer.setRemoteDescription(description);
            await flushCandidates(viewerPeer);

            const answer = await viewerPeer.createAnswer();
            await viewerPeer.setLocalDescription(answer);

            socket.emit("screen:answer", {
                targetId: sharerId,
                description: viewerPeer.localDescription
            });
        } catch (error) {
            console.error("Could not answer screen share:", error);
            onError("Could not connect to the shared screen.");
        }
    };

    const handleAnswer = async ({ viewerId, description }) => {
        const peer = hostPeers.get(viewerId);

        if (!peer) {
            return;
        }

        try {
            await peer.setRemoteDescription(description);
            await flushCandidates(peer);
        } catch (error) {
            console.error("Could not finish viewer connection:", error);
        }
    };

    const handleIceCandidate = async ({ fromId, candidate }) => {
        const peer = hostPeers.get(fromId) || (
            viewerPeer?.remoteId === fromId ? viewerPeer : null
        );

        if (!peer) {
            const queued = earlyCandidates.get(fromId) || [];
            queued.push(candidate);
            earlyCandidates.set(fromId, queued);
            return;
        }

        await addCandidate(peer, candidate);
    };

    const handleViewerLeft = ({ viewerId }) => {
        closeHostPeer(viewerId);
    };

    const handleScreenStopped = ({ sharerId }) => {
        if (sharerId === socket.id) {
            closeHostPeers();
        } else {
            closeViewerPeer();
            activeSharerId = null;
            onRemoteStop();
        }
    };

    socket.on("screen:started", handleScreenStarted);
    socket.on("screen:viewer-ready", handleViewerReady);
    socket.on("screen:offer", handleOffer);
    socket.on("screen:answer", handleAnswer);
    socket.on("screen:ice", handleIceCandidate);
    socket.on("screen:viewer-left", handleViewerLeft);
    socket.on("screen:stopped", handleScreenStopped);

    return {
        async startSharing(stream) {
            localStream = stream;

            try {
                const result = await new Promise((resolve, reject) => {
                    socket.timeout(5000).emit("screen:start", (error, response) => {
                        if (error) {
                            reject(new Error("The server did not answer."));
                            return;
                        }

                        resolve(response);
                    });
                });

                if (!result?.ok) {
                    throw new Error(result?.message || "Could not start screen sharing.");
                }
            } catch (error) {
                localStream = null;
                throw error;
            }
        },

        stopSharing() {
            const wasSharing = Boolean(localStream);
            localStream = null;
            closeHostPeers();

            if (wasSharing) {
                socket.emit("screen:stop");
            }
        },

        cleanup() {
            localStream = null;
            closeHostPeers();
            closeViewerPeer();
            earlyCandidates.clear();

            socket.off("screen:started", handleScreenStarted);
            socket.off("screen:viewer-ready", handleViewerReady);
            socket.off("screen:offer", handleOffer);
            socket.off("screen:answer", handleAnswer);
            socket.off("screen:ice", handleIceCandidate);
            socket.off("screen:viewer-left", handleViewerLeft);
            socket.off("screen:stopped", handleScreenStopped);
        }
    };

    async function createOfferForViewer(viewerId) {
        closeHostPeer(viewerId);

        const peer = createPeer(viewerId, true);
        hostPeers.set(viewerId, peer);

        localStream.getTracks().forEach((track) => {
            peer.addTrack(track, localStream);
        });

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("screen:offer", {
                targetId: viewerId,
                description: peer.localDescription
            });
        } catch (error) {
            closeHostPeer(viewerId);
            console.error("Could not offer screen share:", error);
        }
    }

    function createPeer(remoteId, isHostPeer) {
        const peer = new RTCPeerConnection(PEER_CONFIG);
        peer.remoteId = remoteId;
        peer.pendingCandidates = earlyCandidates.get(remoteId) || [];
        earlyCandidates.delete(remoteId);

        peer.addEventListener("icecandidate", (event) => {
            if (event.candidate) {
                socket.emit("screen:ice", {
                    targetId: remoteId,
                    candidate: event.candidate
                });
            }
        });

        peer.addEventListener("connectionstatechange", () => {
            if (peer.connectionState === "failed") {
                if (isHostPeer) {
                    closeHostPeer(remoteId);
                } else {
                    closeViewerPeer();
                    onError("The shared screen connection was lost.");
                }
            }
        });

        if (!isHostPeer) {
            peer.addEventListener("track", (event) => {
                const incomingStream = event.streams[0];

                if (incomingStream && incomingStream !== remoteStream) {
                    remoteStream = incomingStream;
                    onRemoteStream(incomingStream);
                }
            });
        }

        return peer;
    }

    async function addCandidate(peer, candidate) {
        try {
            if (peer.remoteDescription) {
                await peer.addIceCandidate(candidate);
            } else {
                peer.pendingCandidates.push(candidate);
            }
        } catch (error) {
            console.warn("Could not add screen-share network candidate:", error);
        }
    }

    async function flushCandidates(peer) {
        const candidates = peer.pendingCandidates.splice(0);

        for (const candidate of candidates) {
            await addCandidate(peer, candidate);
        }
    }

    function closeHostPeer(viewerId) {
        hostPeers.get(viewerId)?.close();
        hostPeers.delete(viewerId);
    }

    function closeHostPeers() {
        hostPeers.forEach((peer) => peer.close());
        hostPeers.clear();
    }

    function closeViewerPeer() {
        viewerPeer?.close();
        viewerPeer = null;
        remoteStream = null;
    }
}
