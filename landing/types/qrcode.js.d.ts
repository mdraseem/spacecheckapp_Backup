declare module 'qrcode.js' {
    interface QRCodeOptions {
        text?: string;
        width?: number;
        height?: number;
        colorDark?: string;
        colorLight?: string;
        correctLevel?: number; // e.g., QRCode.CorrectLevel.H
    }

    class QRCode {
        constructor(element: HTMLElement | null, options: QRCodeOptions | string);
        clear(): void;
        makeCode(text: string): void;
    }

    namespace QRCode {
        enum CorrectLevel {
            L, M, Q, H
        }
    }

    export = QRCode;
}
