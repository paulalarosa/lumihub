/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      allowTaint?: boolean;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
    };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: string | HTMLElement): Html2PdfInstance;
    toPdf(): Html2PdfInstance;
    output(type: 'blob' | 'arraybuffer'): Promise<Blob | ArrayBuffer>;
    save(): Html2PdfInstance;
  }

  function html2pdf(): Html2PdfInstance;

  export default html2pdf;
}
