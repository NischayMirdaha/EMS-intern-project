import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { findUserById } from "../models/usermodel.js";
import {
  findOnlineClassById,
  updateOnlineClass,
} from "../models/onlineClassModel.js";
import {
  saveMessage,
  getMessagesByClassId,
} from "../models/classChatModel.js";
import { ROLES } from "../constants/roles.js";

// ─── Constants ───────────────────────────────────────────────────
const MAX_PARTICIPANTS = Number(process.env.MAX_CLASS_PARTICIPANTS) || 25;
const RECONNECT_GRACE_MS = 30_000; // 30 seconds
const CHAT_RATE_WINDOW_MS = 5_000;
const CHAT_RATE_MAX = 10;

const STAFF_ROLES = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

// ─── In-Memory State ─────────────────────────────────────────────
// classId -> Map(socketId -> ParticipantInfo)
const activeRooms = new Map();
// `${userId}:${classId}` -> { participant, timeout, classId }
const disconnectedParticipants = new Map();
// socketId -> { timestamps: number[] }
const chatRateLimiters = new Map();

// ─── Rate Limiter ────────────────────────────────────────────────
const checkChatRateLimit = (socketId) => {
  const now = Date.now();
  let limiter = chatRateLimiters.get(socketId);

  if (!limiter) {
    limiter = { timestamps: [] };
    chatRateLimiters.set(socketId, limiter);
  }

  // Remove timestamps outside the sliding window
  limiter.timestamps = limiter.timestamps.filter(
    (t) => now - t < CHAT_RATE_WINDOW_MS
  );

  if (limiter.timestamps.length >= CHAT_RATE_MAX) {
    return false; // Rate limited
  }

  limiter.timestamps.push(now);
  return true; // Allowed
};

// ─── Main Export ─────────────────────────────────────────────────
export const initClassSocketServer = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ─── Socket Authentication Middleware ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "").trim();

      if (!token) {
        return next(new Error("Authentication error: No token provided."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await findUserById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User not found."));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.user.username} (${socket.id})`);

    let currentRoomId = null;

    // ─────────────────────────────────────────────────────────────
    // 1. JOIN ROOM (with mesh cap, reconnection, ICE, chat history)
    // ─────────────────────────────────────────────────────────────
    socket.on("join-room", async ({ classId }) => {
      try {
        if (!classId) {
          return socket.emit("error-message", "Class ID is required.");
        }

        const numericClassId = Number(classId);
        const onlineClass = await findOnlineClassById(numericClassId);

        if (!onlineClass) {
          return socket.emit("error-message", "Online class not found.");
        }

        // External-link classes don't use WebRTC signaling
        if (onlineClass.classMode === "external") {
          return socket.emit("error-message", {
            code: "EXTERNAL_CLASS",
            message: "This class uses an external meeting link.",
            meetingUrl: onlineClass.meetingUrl,
          });
        }

        // Student enrollment check
        if (socket.user.role === ROLES.STUDENT) {
          const belongsToStudentClass =
            socket.user.className &&
            onlineClass.className === socket.user.className &&
            (!onlineClass.section || onlineClass.section === socket.user.section);

          if (!belongsToStudentClass) {
            return socket.emit(
              "error-message",
              "You are not enrolled in this class."
            );
          }
        }

        // Leave previous room if any
        if (currentRoomId) {
          socket.leave(`class_${currentRoomId}`);
          leaveRoomCleanup(socket, currentRoomId, io);
        }

        if (!activeRooms.has(numericClassId)) {
          activeRooms.set(numericClassId, new Map());
        }

        const roomParticipants = activeRooms.get(numericClassId);

        // ── Reconnection check ──────────────────────────────────
        const disconnectKey = `${socket.user.id}:${numericClassId}`;
        const pendingReconnect = disconnectedParticipants.get(disconnectKey);
        let participantInfo;

        if (pendingReconnect) {
          // Restore previous participant state (hand raise, media toggles, etc.)
          clearTimeout(pendingReconnect.timeout);
          disconnectedParticipants.delete(disconnectKey);
          participantInfo = {
            ...pendingReconnect.participant,
            socketId: socket.id, // New socket ID
          };
          console.log(
            `[Socket] Reconnected: ${socket.user.username} restored state in class_${numericClassId}`
          );
        } else {
          // ── Participant cap check ─────────────────────────────
          if (roomParticipants.size >= MAX_PARTICIPANTS) {
            return socket.emit("error-message", {
              code: "ROOM_FULL",
              message: `This class is full (max ${MAX_PARTICIPANTS} participants).`,
            });
          }

          participantInfo = {
            socketId: socket.id,
            userId: socket.user.id,
            username: socket.user.username,
            role: socket.user.role,
            audioEnabled: true,
            videoEnabled: true,
            isScreenSharing: false,
            isHandRaised: false,
            joinedAt: new Date(),
          };
        }

        currentRoomId = numericClassId;
        const roomName = `class_${currentRoomId}`;
        socket.join(roomName);

        // Update class status to 'ongoing' if teacher joins
        if (STAFF_ROLES.includes(socket.user.role) && onlineClass.status === "scheduled") {
          await updateOnlineClass(numericClassId, { status: "ongoing" });
        }

        roomParticipants.set(socket.id, participantInfo);

        // Fetch existing participants (for full-mesh initiation)
        const existingParticipants = Array.from(roomParticipants.values()).filter(
          (p) => p.socketId !== socket.id
        );

        // Fetch chat history (last 50 messages)
        let chatHistory = [];
        try {
          chatHistory = await getMessagesByClassId(numericClassId, { limit: 50 });
        } catch (err) {
          console.error("[Socket] Failed to load chat history:", err.message);
        }

        // Send join payload with participants and chat history
        socket.emit("room-joined", {
          classId: currentRoomId,
          classDetails: onlineClass,
          self: participantInfo,
          participants: existingParticipants,
          chatHistory,
          maxParticipants: MAX_PARTICIPANTS,
          isReconnect: Boolean(pendingReconnect),
        });

        // Notify other participants in the room
        socket.to(roomName).emit("user-joined", participantInfo);

        console.log(
          `[Socket] ${socket.user.username} joined room class_${currentRoomId} ` +
            `(${roomParticipants.size}/${MAX_PARTICIPANTS})`
        );
      } catch (error) {
        console.error("[Socket] join-room error:", error);
        socket.emit("error-message", "Failed to join room.");
      }
    });


    // 3. MEDIA & CLASSROOM CONTROLS
    // ─────────────────────────────────────────────────────────────
    socket.on("toggle-media", ({ audioEnabled, videoEnabled }) => {
      if (!currentRoomId) return;
      const roomParticipants = activeRooms.get(currentRoomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        if (audioEnabled !== undefined) participant.audioEnabled = audioEnabled;
        if (videoEnabled !== undefined) participant.videoEnabled = videoEnabled;

        socket.to(`class_${currentRoomId}`).emit("user-media-toggled", {
          socketId: socket.id,
          userId: socket.user.id,
          audioEnabled: participant.audioEnabled,
          videoEnabled: participant.videoEnabled,
        });
      }
    });

    socket.on("toggle-hand", ({ isHandRaised }) => {
      if (!currentRoomId) return;
      const roomParticipants = activeRooms.get(currentRoomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.isHandRaised = Boolean(isHandRaised);

        io.to(`class_${currentRoomId}`).emit("user-hand-toggled", {
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username,
          isHandRaised: participant.isHandRaised,
        });
      }
    });

    socket.on("toggle-screen-share", ({ isScreenSharing }) => {
      if (!currentRoomId) return;
      const roomParticipants = activeRooms.get(currentRoomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.isScreenSharing = Boolean(isScreenSharing);

        socket.to(`class_${currentRoomId}`).emit("user-screen-share-toggled", {
          socketId: socket.id,
          userId: socket.user.id,
          isScreenSharing: participant.isScreenSharing,
        });
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 4. CHAT (Rate-limited + Persisted)
    // ─────────────────────────────────────────────────────────────
    socket.on("send-chat-message", async ({ message }) => {
      if (!currentRoomId || !message?.trim()) return;

      // Rate limit check
      if (!checkChatRateLimit(socket.id)) {
        return socket.emit("chat-rate-limited", {
          message: `Rate limited: max ${CHAT_RATE_MAX} messages per ${CHAT_RATE_WINDOW_MS / 1000}s.`,
          retryAfterMs: CHAT_RATE_WINDOW_MS,
        });
      }

      const trimmedMessage = message.trim().substring(0, 2000); // Max 2000 chars

      // Persist to database
      let savedMessage;
      try {
        savedMessage = await saveMessage({
          classId: currentRoomId,
          senderId: socket.user.id,
          message: trimmedMessage,
        });
      } catch (err) {
        console.error("[Socket] Failed to save chat message:", err.message);
        // Still broadcast even if persistence fails (degrade gracefully)
        savedMessage = {
          id: `temp-${Date.now()}`,
          classId: currentRoomId,
          senderId: socket.user.id,
          senderName: socket.user.username,
          senderRole: socket.user.role,
          message: trimmedMessage,
          createdAt: new Date(),
        };
      }

      io.to(`class_${currentRoomId}`).emit("chat-message", savedMessage);
    });

    // ─────────────────────────────────────────────────────────────
    // 5. HOST / TEACHER CONTROLS
    // ─────────────────────────────────────────────────────────────
    const isStaff = STAFF_ROLES.includes(socket.user.role);

    socket.on("host-mute-user", ({ targetSocketId, mediaType }) => {
      if (!isStaff || !targetSocketId || !currentRoomId) return;
      io.to(targetSocketId).emit("force-mute", {
        mediaType: mediaType || "audio",
        by: socket.user.username,
      });
    });

    socket.on("host-kick-user", ({ targetSocketId, reason }) => {
      if (!isStaff || !targetSocketId || !currentRoomId) return;
      io.to(targetSocketId).emit("force-kick", {
        reason: reason || "Removed by host.",
      });

      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(`class_${currentRoomId}`);
        // Remove immediately (no grace period for kicks)
        immediateLeaveCleanup(targetSocket, currentRoomId, io);
      }
    });

    socket.on("end-class-session", async ({ classId }) => {
      if (!isStaff || !currentRoomId) return;
      const numericClassId = Number(classId) || currentRoomId;

      await updateOnlineClass(numericClassId, { status: "completed" });

      io.to(`class_${numericClassId}`).emit("class-ended", {
        message: "The host has ended the class session.",
      });

      // Clean up all disconnection timers for this room
      for (const [key, entry] of disconnectedParticipants) {
        if (entry.classId === numericClassId) {
          clearTimeout(entry.timeout);
          disconnectedParticipants.delete(key);
        }
      }

      activeRooms.delete(numericClassId);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. DISCONNECT / LEAVE (with reconnection grace period)
    // ─────────────────────────────────────────────────────────────
    socket.on("leave-room", () => {
      if (currentRoomId) {
        socket.leave(`class_${currentRoomId}`);
        // Explicit leave = no grace period
        immediateLeaveCleanup(socket, currentRoomId, io);
        currentRoomId = null;
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.user.username} (${socket.id})`);
      chatRateLimiters.delete(socket.id);

      if (currentRoomId) {
        // Start reconnection grace period instead of immediate removal
        gracefulDisconnect(socket, currentRoomId, io);
      }
    });
  });

  return io;
};

// ─── Cleanup Helpers ─────────────────────────────────────────────

// Immediate removal (explicit leave or kick — no grace period)
const immediateLeaveCleanup = (socket, classId, io) => {
  if (!classId || !activeRooms.has(classId)) return;

  const roomParticipants = activeRooms.get(classId);
  if (roomParticipants.has(socket.id)) {
    roomParticipants.delete(socket.id);

    io.to(`class_${classId}`).emit("user-left", {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
    });

    if (roomParticipants.size === 0) {
      activeRooms.delete(classId);
    }
  }

  // Cancel any pending reconnection for this user in this class
  const disconnectKey = `${socket.user.id}:${classId}`;
  const pending = disconnectedParticipants.get(disconnectKey);
  if (pending) {
    clearTimeout(pending.timeout);
    disconnectedParticipants.delete(disconnectKey);
  }
};

// Graceful disconnect — keeps participant slot for RECONNECT_GRACE_MS
const gracefulDisconnect = (socket, classId, io) => {
  if (!classId || !activeRooms.has(classId)) return;

  const roomParticipants = activeRooms.get(classId);
  const participant = roomParticipants.get(socket.id);
  if (!participant) return;

  // Remove from active room immediately (free the socket ID slot)
  roomParticipants.delete(socket.id);

  // Notify others that user is temporarily disconnected
  io.to(`class_${classId}`).emit("user-disconnected", {
    socketId: socket.id,
    userId: socket.user.id,
    username: socket.user.username,
    gracePeriodMs: RECONNECT_GRACE_MS,
  });

  // Store participant state for potential reconnection
  const disconnectKey = `${socket.user.id}:${classId}`;
  const timeout = setTimeout(() => {
    // Grace period expired — treat as a real leave
    disconnectedParticipants.delete(disconnectKey);

    io.to(`class_${classId}`).emit("user-left", {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
    });

    // Clean up empty rooms
    if (activeRooms.has(classId) && activeRooms.get(classId).size === 0) {
      activeRooms.delete(classId);
    }

    console.log(
      `[Socket] ${socket.user.username} reconnection grace expired for class_${classId}`
    );
  }, RECONNECT_GRACE_MS);

  disconnectedParticipants.set(disconnectKey, {
    participant,
    timeout,
    classId,
  });

  console.log(
    `[Socket] ${socket.user.username} disconnected from class_${classId}, ` +
      `${RECONNECT_GRACE_MS / 1000}s grace period started`
  );
};

// Called on old socket during room change (leave previous before joining new)
const leaveRoomCleanup = (socket, classId, io) => {
  immediateLeaveCleanup(socket, classId, io);
};
