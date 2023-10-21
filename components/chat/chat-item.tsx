"use client";

import { Member, MemberRole, Profile } from "@prisma/client";
import UserAvatar from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { Edit, FileIcon, ShieldAlert, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import axios from "axios";
import qs from "query-string";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useParams, useRouter } from "next/navigation";

interface ChatItemProps {
    id: string;
    content: string;
    member: Member & {
        profile: Profile;
    };
    timestamp: string;
    fileUrl: string | null;
    deleted: boolean;
    currentMember: Member;
    isUpdated: boolean;
    socketUrl: string;
    socketQuery: Record<string, string>;
}

const roleIconMap = {
    [MemberRole.GUEST]: null,
    [MemberRole.MODERATOR]: (
        <ShieldAlert className="h-4 w-4 ml-2 text-indigo-500" />
    ),
    [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

const formSchema = z.object({
    content: z.string().min(1),
});

export function ChatItem({
    id,
    content,
    member,
    timestamp,
    fileUrl,
    deleted,
    currentMember,
    isUpdated,
    socketUrl,
    socketQuery,
}: ChatItemProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const { onOpen } = useModal();

    const router = useRouter();
    const params = useParams();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content,
        },
    });

    const fileType = useMemo(() => fileUrl?.split(".").pop(), [fileUrl]);

    const isAdmin = useMemo(
        () => currentMember.role === MemberRole.ADMIN,
        [currentMember]
    );
    const isModerator = useMemo(
        () => currentMember.role === MemberRole.MODERATOR,
        [currentMember]
    );
    const isOwner = useMemo(
        () => currentMember.id === member.id,
        [currentMember, member]
    );
    const canDeleteMessage = useMemo(
        () => !deleted && (isAdmin || isModerator || isOwner),
        [deleted, isAdmin, isModerator, isOwner]
    );
    const canEditMessage = useMemo(
        () => !deleted && isOwner && !fileUrl,
        [deleted, isOwner, fileUrl]
    );
    const isPDF = useMemo(
        () => fileType === "pdf" && fileUrl,
        [fileType, fileUrl]
    );
    const isImage = useMemo(() => !isPDF && fileUrl, [isPDF, fileUrl]);

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: `${socketUrl}/${id}`,
                query: socketQuery,
            });

            await axios.patch(url, values);

            form.reset();
            setIsEditing(false);
        } catch (error) {
            console.log(error);
        }
    };

    const handleClickMember = () => {
        if (member.id === currentMember.id) {
            return;
        }

        router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsEditing(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        form.reset({
            content,
        });
    }, [content, form]);

    return (
        <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
            <div className="group flex gap-x-2 items-start w-full">
                <div className="cursor-pointer hover:drop-shadow-md transition">
                    <UserAvatar src={member.profile.imageUrl} />
                </div>
                <div className="flex flex-col w-full">
                    <div className="flex items-center gap-x-2">
                        <div
                            className="flex items-center"
                            onClick={handleClickMember}
                        >
                            <p className="font-semibold text-xs hover:underline cursor-pointer">
                                {member.profile.name}
                            </p>
                            <ActionTooltip label={member.role}>
                                {roleIconMap[member.role]}
                            </ActionTooltip>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {timestamp}
                        </span>
                    </div>

                    {isImage && (
                        <a
                            href={fileUrl || ""}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="relative aspect-square rounded-md mt-2 flex items-center border overflow-hidden h-48 w-48 bg-secondary"
                        >
                            <Image
                                fill
                                src={fileUrl || ""}
                                alt="content"
                                className="object-cover"
                            />
                        </a>
                    )}
                    {isPDF && (
                        <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
                            <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
                            <a
                                href={fileUrl || ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
                            >
                                PDF file
                            </a>
                        </div>
                    )}
                    {!fileUrl && !isEditing && (
                        <p
                            className={cn(
                                "text-sm text-zinc-600 dark:text-zinc-300",
                                deleted &&
                                    "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
                            )}
                        >
                            {content}
                            {isUpdated && !deleted && (
                                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                                    (edited)
                                </span>
                            )}
                        </p>
                    )}
                    {!fileUrl && isEditing && (
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex items-center w-full gap-x-2 pt-2"
                            >
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="relative w-full">
                                                    <Input
                                                        className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    disabled={isLoading}
                                    size="sm"
                                    variant="primary"
                                >
                                    Save
                                </Button>
                            </form>
                            <span className="text-[10px] mt-1 text-zinc-400">
                                Press escape to cancel, enter to save
                            </span>
                        </Form>
                    )}
                </div>
            </div>
            {canDeleteMessage && (
                <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
                    {canEditMessage && (
                        <ActionTooltip label="Edit">
                            <Edit
                                onClick={() => setIsEditing(true)}
                                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                            />
                        </ActionTooltip>
                    )}
                    <ActionTooltip label="Delete">
                        <Trash
                            onClick={() =>
                                onOpen("deleteMessage", {
                                    apiUrl: `${socketUrl}/${id}`,
                                    query: socketQuery,
                                })
                            }
                            className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                        />
                    </ActionTooltip>
                </div>
            )}
        </div>
    );
}
