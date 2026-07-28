export interface AvatarCropperExpose {
    createCroppedAvatarFile(): Promise<File | null>;
    reset(): void;
}