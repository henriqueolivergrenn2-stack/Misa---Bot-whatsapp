/**
 * Interceptadores diversos.
 *
 * @author Dev Gui
 */
import { messageHandler } from "./messageHandler.js";
import { onGroupParticipantsUpdate } from "./onGroupParticipantsUpdate.js";
import { onMessagesUpsert } from "./onMesssagesUpsert.js";
import { hasVipAccess } from "../utils/vipManager.js";

export { messageHandler, onGroupParticipantsUpdate, onMessagesUpsert };

import { delay } from "baileys";
import { OWNER_LID } from "../config.js";
import { getPrefix } from "../utils/database.js";

function normalizeId(id) {
  if (!id) return "";
  return id.replace(/@.*$/, "").replace(/:[0-9]+/g, "");
}

export function verifyPrefix(prefix, groupJid) {
  const groupPrefix = getPrefix(groupJid);
  return groupPrefix === prefix;
}

export function hasTypeAndCommand({ type, command }) {
  return !!type && !!command;
}

export function isLink(text) {
  const cleanText = text.trim();

  if (/^\d+$/.test(cleanText)) {
    return false;
  }

  if (/[.]{2,3}/.test(cleanText)) {
    return false;
  }

  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (ipPattern.test(cleanText.split("/")[0])) {
    return true;
  }

  const urlPattern =
    /(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/[^\s]*)?/g;

  const matches = cleanText.match(urlPattern);

  if (!matches || matches.length === 0) {
    return false;
  }

  const fileExtensions =
    /\.(txt|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|jpg|jpeg|png|gif|mp4|mp3|avi)$/i;

  return matches.some((match) => {
    const cleanMatch = match.replace(/^https?:\/\//, "").replace(/^www\./, "");

    const matchIndex = cleanText.indexOf(match);

    const beforeMatch = cleanText.substring(0, matchIndex);

    const afterMatch = cleanText.substring(matchIndex + match.length);

    const charBefore = beforeMatch.slice(-1);

    const charAfter = afterMatch.slice(0, 1);

    if (
      charBefore &&
      /[a-zA-Z0-9]/.test(charBefore) &&
      !/[\s\.\,\:\;\!\?\(\)\[\]\{\}]/.test(charBefore)
    ) {
      return false;
    }

    if (
      charAfter &&
      /[a-zA-Z0-9]/.test(charAfter) &&
      !/[\s\.\,\:\;\!\?\(\)\[\]\{\}\/]/.test(charAfter)
    ) {
      return false;
    }

    if (/\s/.test(cleanMatch)) {
      return false;
    }

    if (fileExtensions.test(cleanMatch)) {
      return false;
    }

    const domainPart = cleanMatch.split("/")[0];
    if (domainPart.split(".").length < 2) {
      return false;
    }

    const parts = domainPart.split(".");
    const extension = parts[parts.length - 1];
    if (extension.length < 2) {
      return false;
    }

    try {
      const url = new URL("https://" + cleanMatch);
      return url.hostname.includes(".") && url.hostname.length > 4;
    } catch {
      return false;
    }
  });
}

export async function isAdmin({ remoteJid, userLid, socket }) {
  const { participants, owner } = await socket.groupMetadata(remoteJid);

  const participant = participants.find(
    (p) => normalizeId(p.id) === normalizeId(userLid)
  );

  if (!participant) {
    return normalizeId(userLid) === normalizeId(OWNER_LID);
  }

  const isOwner =
    normalizeId(userLid) === normalizeId(owner) ||
    participant.admin === "superadmin";

  const isAdminRole = participant.admin === "admin";

  return isOwner || isAdminRole;
}

export function isBotOwner({ userLid }) {
  return normalizeId(userLid) === normalizeId(OWNER_LID);
}

export async function checkPermission({ type, socket, userLid, remoteJid }) {
  if (type === "member") {
    return true;
  }

  try {
    await delay(500);

    const { participants, owner } = await socket.groupMetadata(remoteJid);

    const participant = participants.find(
      (p) => normalizeId(p.id) === normalizeId(userLid)
    );

    const isBotOwnerResult = normalizeId(userLid) === normalizeId(OWNER_LID);

    if (type === "owner" && isBotOwnerResult) {
      return true;
    }

    if (!participant) {
      return false;
    }

// dentro do checkPermission:
if (type === "vip") {
  return hasVipAccess(userLid, remoteJid);
}
    const isOwner =
      normalizeId(userLid) === normalizeId(owner) ||
      participant.admin === "superadmin";

    const isAdminRole = isOwner || participant.admin === "admin";

    const ownerStillInGroup = participants.some(
      (p) => normalizeId(p.id) === normalizeId(owner)
    );

    const hasSuperAdmin = participants.some(
      (p) => p.admin === "superadmin"
    );

    if (type === "admin") {
      return isOwner || isAdminRole || isBotOwnerResult;
    }

    if (type === "owner") {
      if (isOwner) {
        return true;
      }

      if (!ownerStillInGroup || !hasSuperAdmin) {
        return isAdminRole;
      }

      return false;
    }

    return false;
  } catch (error) {
    return false;
  }
}
