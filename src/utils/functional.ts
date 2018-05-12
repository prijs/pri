export const pipeEvent = (func: any) => {
  return (event: any) => {
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

export function ensureStartWithWebpackRelativePoint(str: string) {
  if (str.startsWith("/")) {
    throw Error(`${str} is an absolute path!`)
  }

  if (!str.startsWith("./") && !str.startsWith("../")) {
    return "./" + str
  } else {
    return str
  }
}
