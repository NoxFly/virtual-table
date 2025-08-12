/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */

export class EventManager {
    private readonly listeners = new Map<symbol, EventListener>();

    /**
     * Ajoute un écouteur en liant `this` une seule fois.
     * Retourne le symbol à utiliser pour le remove.
     */
    public listenTo<K extends keyof DocumentEventMap>(
        target: EventTarget,
        type: K,
        callback: (this: Document, ev: DocumentEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): symbol {
        const symbolId = Symbol.for(callback.name);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        const boundCallback = (callback as Function).bind(this) as EventListener;

        this.listeners.set(symbolId, boundCallback);
        target.addEventListener(type, boundCallback, options);

        return symbolId;
    }

    /**
     * Supprime un écouteur à partir de son symbol.
     */
    public stopListenTo<K extends keyof DocumentEventMap>(
        target: EventTarget,
        type: K,
        symbolId: symbol | ((this: Document, ev: DocumentEventMap[K]) => void),
        options?: boolean | EventListenerOptions
    ): void {
        if(typeof symbolId === 'function') {
            symbolId = Symbol.for(symbolId.name);
        }

        const listener = this.listeners.get(symbolId);
        
        if(listener) {
            target.removeEventListener(type, listener, options);
            this.listeners.delete(symbolId);
        }
    }

    /**
     * Supprime tous les écouteurs gérés par cette instance.
     */
    public removeAllListeners(target: EventTarget, type?: string): void {
        for(const [symbolId, listener] of this.listeners) {
            if(type) {
                target.removeEventListener(type, listener);
            }
            else {
                // Sans type, on ne peut pas retirer directement, il faudrait stocker type dans la Map aussi
                console.warn("Impossible de removeAll sans type stocké, il faut étendre la structure.");
            }
        }

        this.listeners.clear();
    }
}