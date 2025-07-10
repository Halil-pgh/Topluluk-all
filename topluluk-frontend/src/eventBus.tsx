type EventHandler = (data?: any) => void;

const eventBus = {
  on(event: string, callback: EventHandler) {
    document.addEventListener(event, (e: Event) => callback((e as CustomEvent).detail));
  },
  dispatch(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  off(event: string, callback: EventHandler) {
    document.removeEventListener(event, callback as EventListener);
  },
};

export default eventBus;