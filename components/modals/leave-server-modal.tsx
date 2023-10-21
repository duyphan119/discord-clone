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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal-store";
import { useOrigin } from "@/hooks/use-origin";
import axios from "axios";
import { Check, Copy, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const LeaveServerModal = () => {
    const { type, onClose, isOpen, data } = useModal();
    const router = useRouter();
    const isModalOpen = isOpen && type === "leaveServer";

    const { server } = data;

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleClickConfirm = async () => {
        try {
            setIsLoading(true);
            await axios.patch(`/api/servers/${server?.id}/leave`);
            onClose();
            router.refresh();
            router.push("/");
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
                        Leave Server
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500">
                        Are you sure you want to leave{" "}
                        <span className="font-semibold text-indigo-500">
                            {server?.name}
                        </span>
                        ?
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
