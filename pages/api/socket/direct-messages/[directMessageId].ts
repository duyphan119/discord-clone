import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    if (req.method !== "DELETE" && req.method !== "PATCH") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const profile = await currentProfilePages(req);
        const { directMessageId, conversationId } = req.query;

        const { content } = req.body;

        if (!profile) {
            return res.status(401).json({ error: "Authorized" });
        }

        if (!directMessageId) {
            return res.status(400).json({ error: "Direct Message ID Missing" });
        }

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID Missing" });
        }

        const conversation = await db.conversation.findFirst({
            where: {
                id: conversationId as string,
                OR: [
                    {
                        memberOne: { profileId: profile.id },
                    },
                    {
                        memberTwo: { profileId: profile.id },
                    },
                ],
            },
            include: {
                memberOne: {
                    include: { profile: true },
                },
                memberTwo: {
                    include: { profile: true },
                },
            },
        });
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const member =
            conversation.memberOne.profileId === profile.id
                ? conversation.memberOne
                : conversation.memberTwo;

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        let directMessage = await db.directMessage.findFirst({
            where: {
                id: directMessageId as string,
                conversationId: conversationId as string,
            },
            include: {
                member: { include: { profile: true } },
            },
        });
        if (!directMessage || directMessage.deleted) {
            return res.status(404).json({ error: "Message not found" });
        }

        const isDirectMessageOwner = directMessage.memberId === member.id;
        const isAdmin = member.role === MemberRole.ADMIN;
        const isModerator = member.role === MemberRole.MODERATOR;
        const canModify = isDirectMessageOwner || isAdmin || isModerator;

        if (!canModify) {
            return res.status(401).json({ error: "Authorized" });
        }
        if (req.method === "DELETE") {
            directMessage = await db.directMessage.update({
                where: {
                    id: directMessageId as string,
                },
                data: {
                    fileUrl: null,
                    content: "This message has been deleted",
                    deleted: true,
                },
                include: {
                    member: { include: { profile: true } },
                },
            });
        }
        if (req.method === "PATCH") {
            if (!isDirectMessageOwner) {
                return res.status(401).json({ error: "Authorized" });
            }
            directMessage = await db.directMessage.update({
                where: {
                    id: directMessageId as string,
                },
                data: {
                    content,
                },
                include: {
                    member: { include: { profile: true } },
                },
            });
        }

        const updateKey = `chat:${conversation.id}:messages:update`;
        res?.socket?.server?.io?.emit(updateKey, directMessage);

        return res.status(200).json(directMessage);
    } catch (error) {
        console.log("[MESSAGE_ID]", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
