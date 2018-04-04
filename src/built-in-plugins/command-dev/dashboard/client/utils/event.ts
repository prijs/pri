export declare type EventType = number | string

export interface IEvent {
  callback: (context?: any) => void
}

export type ICallback = (context?: any) => void

export class Event {
  private events: Map<EventType, IEvent[]> = new Map()

  public on(eventType: EventType, callback: ICallback): void {
    const event: IEvent = {
      callback
    }

    if (this.events.get(eventType)) {
      this.events.get(eventType).push(event)
    } else {
      this.events.set(eventType, [event])
    }
  }

  public off(eventType: EventType, callback: ICallback) {
    if (!this.events.get(eventType)) {
      return false
    }

    const events = this.events.get(eventType).filter(event => {
      return event.callback !== callback
    })

    this.events.set(eventType, events)

    return true
  }

  public emit(eventType: EventType, context?: any) {
    if (!eventType || !this.events.get(eventType)) {
      return false
    }

    this.events.get(eventType).forEach(event => {
      event.callback(context)
    })
  }
}
