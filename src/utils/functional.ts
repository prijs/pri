export const pipeEvent = (func: any) => {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    return func(event.target.value, event)
  }
}

export function ensureEndWithSlash(str: string) {
  if (str.endsWith("/")) {
    return str
  } else {
    return str + "/"
  }
}
