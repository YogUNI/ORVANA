declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, options?: any);
    loadFromHTML(elements: NodeListOf<Element> | HTMLElement[]): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    flip(page: number, corner?: string): void;
    destroy(): void;
    on(event: string, callback: (e: any) => void): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
  }
}
