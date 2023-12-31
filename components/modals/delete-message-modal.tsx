"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import axios from "axios";
import qs from "query-string";
import { useState } from "react";

export const DeleteMessageModal = () => {
    const { type, onClose, isOpen, data } = useModal();
    const isModalOpen = isOpen && type === "deleteMessage";

    const { apiUrl, query } = data;

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleClickConfirm = async () => {
        try {
            setIsLoading(true);
            const url = qs.stringifyUrl({
                url: apiUrl || "",
                query,
            });
            await axios.delete(url);
            onClose();
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white text-black p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Delete Message
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500">
                        Are you sure you want to dto this?
                        <br />
                        The message will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="px-6 py-4 bg-gray-100">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            variant="ghost"
                        >
                            Cannel
                        </Button>
                        <Button
                            disabled={isLoading}
                            variant="primary"
                            onClick={handleClickConfirm}
                        >
                            Confirm
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
