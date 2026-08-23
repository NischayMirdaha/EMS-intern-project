import { AccessToken } from "livekit-server-sdk";
import { ROLES } from "../constants/roles.js";

const STAFF_ROLES = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

export const isSfuConfigured = () => {
  return Boolean(
    process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET
  );
};

export const generateSfuToken = async ({ classId, user, isHost }) => {
  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";
  const sfuUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";

  const roomName = `class_${classId}`;
  const identity = `user_${user.id}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: user.username,
    metadata: JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
    }),
    ttl: "4h",
  });

  const isTeacherOrAdmin = isHost || STAFF_ROLES.includes(user.role);

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isTeacherOrAdmin,
    roomCreate: isTeacherOrAdmin,
  });

  const token = await at.toJwt();

  return {
    sfuUrl,
    token,
    roomName,
    identity,
    isSfuConfigured: isSfuConfigured(),
  };
};
