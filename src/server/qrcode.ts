import QRCode from "qrcode";

/**
 * Generate a QR code for a memorial URL
 * @param memorialUrl The full URL to the memorial page
 * @returns Base64 encoded PNG image
 */
export async function generateMemorialQRCode(memorialUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(memorialUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate a QR code as SVG string
 * @param memorialUrl The full URL to the memorial page
 * @returns SVG string
 */
export async function generateMemorialQRCodeSVG(memorialUrl: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(memorialUrl, {
      type: "svg",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return svgString;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    throw new Error("Failed to generate QR code");
  }
}
