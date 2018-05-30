const pipes = new Map<string, any[]>();

export const get = (pipeName: string, defaultValue: any) => {
  if (!pipes.has(pipeName)) {
    return defaultValue;
  }

  return pipes.get(pipeName).reduce((value, pipe) => {
    return pipe(value);
  }, defaultValue);
};

export const set = (pipeName: string, callback: (text?: string) => string) => {
  if (!pipes.has(pipeName)) {
    pipes.set(pipeName, [callback]);
  } else {
    pipes.get(pipeName).push(callback);
  }
};

export const clear = () => {
  pipes.clear();
};
